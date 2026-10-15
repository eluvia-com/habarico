import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Identifier} from 'react-admin';
import {useNavigate} from 'react-router-dom';
import {BaseActionTriggerProps} from '@admin/components/buttons/types';
import {UnsavedChangesDialog} from '@admin/components/dialogs/UnsavedChangesDialog';
import {ViewDialog} from '@admin/components/views/ViewDialog';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useUnsavedChangesControl} from '@admin/contexts/UnsavedChangesContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {useGetLinkWithData} from '@admin/hooks/useGetLinkWithData';
import {useDialog} from '@design/hooks/useDialog';
import {NavMode, openByMode} from '@foundation/utils/navigation';
import {SchemaViewRouter} from '@schema/components/views/SchemaViewRouter';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {SidePanelView, ViewModeType, ViewType} from '@schema/types';
import {isRoutedViewMode, resolveOpenMode} from '@schema/utils/viewMode';

export type SchemaViewActionTriggerProps = {
  viewType: ViewType;
  viewName: string;
  actionName?: string;
  reference?: string;
  recordPk?: Identifier;
  // The mode the *action* asked for (`schema.view.mode`), unresolved: `undefined` when the action
  // set none. It is not merged with the target view's own `mode` by the caller - `resolveOpenMode`
  // below does that, and the two must stay distinguishable, because only an explicit `redirect`
  // leaves an overlay while a default gesture keeps swapping the view inside it.
  mode?: ViewModeType;
  // Navigation mode for a redirect (ctrl/cmd/shift -> open in a new tab/window).
  navMode?: NavMode;
  target?: string;
  // Whether a redirect keeps the linked parent prefix in the URL. Defaults to true here (the single
  // funnel for opening a view), so buttons, row activation and post-actions all behave the same
  // unless the action explicitly sets it to false.
  keepLinkedParent?: boolean;
  dialogWidth?: string;
  pathname?: string;
  params?: Record<string, string>;
  // Whether a same-tab redirect replaces the current history entry instead of pushing a new one.
  // For a trigger that stands in for a navigation which would have replaced it (the after-save
  // redirect of a create/edit view), so "back" does not return to a form that was already saved.
  replace?: boolean;
} & BaseActionTriggerProps;

// Opens a target view by its resolved presentation mode: docks into the list side panel, opens a
// dialog (with the view's title/actions portaled into the dialog header), swaps the view in place
// when already in a dialog, or redirects. Runs on mount, so it is used both as a post-action and as
// the shared open behaviour behind SchemaViewButton and row activation.
export const SchemaViewActionTrigger = ({
  viewType,
  viewName,
  actionName,
  reference,
  recordPk,
  mode,
  navMode,
  target,
  keepLinkedParent = true,
  dialogWidth,
  onDone,
  pathname,
  params,
  replace,
}: SchemaViewActionTriggerProps) => {
  const {changeView, closeOverlay} = useSchemaViewRouterContext();
  const {presentation} = useViewPresentation();
  const navigate = useNavigate();
  const resource = useResourceContext(reference);
  const getLink = useGetLinkWithData(resource);
  const {open, openDialog, data, closeDialog} = useDialog<Record<string, string>>();
  const {getHasUnsavedChanges} = useUnsavedChangesControl();
  const {navigationGuard} = useAdminConfig();

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const {getGlobalViewSchema} = useGlobalResourceSchemaContext(reference);
  const viewDefaultMode = getGlobalViewSchema(viewName)?.mode;
  // A redirect can only happen when the target view is actually routed (has a URL). A view
  // presented as dialog/sidepanel has no route, so redirecting to it is impossible.
  const canRedirect = isRoutedViewMode(viewDefaultMode);

  const sidePanel = useSidePanelController<SidePanelView>();
  const inDialog = presentation === 'dialog';

  // The surface this trigger opens on, resolved once from the action's mode, the target view's own
  // mode, the container we fire from and whether there is a panel to dock into. Everything below -
  // the effect and the dialog in the JSX alike - is driven by this one value.
  const openMode = resolveOpenMode(mode, viewDefaultMode, presentation, !!sidePanel);

  const changeViewOrDefer = useCallback(
    (action: () => void) => {
      if (navigationGuard && getHasUnsavedChanges()) {
        setPendingAction(() => action);
      } else {
        action();
      }
    },
    [navigationGuard, getHasUnsavedChanges]
  );

  // Swapping the view inside the overlay: its surface is already mounted, so no route/URL is
  // needed - the router is simply re-pointed at the target view.
  const swapView = useCallback(
    () =>
      changeViewOrDefer(() =>
        changeView({resource, viewType, viewName, actionName, id: recordPk, data: params})
      ),
    [changeViewOrDefer, changeView, resource, viewType, viewName, actionName, recordPk, params]
  );

  // Leaving for the target view's own route: reports the activation as done (the trigger is unmounted
  // by its caller) and, for a same-tab navigation, that it navigated - so the caller skips its own
  // follow-up redirect - then navigates. A view that declares itself as dialog/sidepanel has no route, so
  // an action pointing a redirect at one asked for the impossible - a contradictory schema, reported
  // here, next to the URL that cannot be built for it. It is refused on every surface alike: a dialog
  // could swap the view in place instead, but then the one surface able to paper over the
  // contradiction would be the only one that never reports it.
  const redirect = useCallback(() => {
    if (!canRedirect) {
      console.warn(
        `Cannot open view "${viewName}"${
          resource ? ` of resource "${resource}"` : ''
        } via redirect: the view is not routed (its mode is dialog or sidepanel). The action does nothing.`
      );
      onDone?.();
      return;
    }
    const link = getLink({
      type: viewType,
      resource,
      actionName,
      id: recordPk,
      target,
      keepLinkedParent,
      pathname: pathname,
      params: params,
    });
    if (!link) {
      onDone?.();
      return;
    }
    // A new tab/window leaves this one untouched, so the overlay it was fired from stays open.
    if (navMode && openByMode(link, navMode)) {
      onDone?.();
      return;
    }
    onDone?.({navigated: true});
    if (replace) navigate(link, {replace: true});
    else navigate(link);
    // Nothing else closes the overlay on navigation: its open state is owned above this trigger
    // and React keeps that owner mounted when only the route params change (the common case - one
    // record's page opening another's), so the dialog/panel would hang over the target page. On a
    // page surface there is no overlay and the call is simply absent.
    closeOverlay?.();
  }, [
    getLink,
    viewType,
    resource,
    actionName,
    recordPk,
    target,
    keepLinkedParent,
    pathname,
    params,
    replace,
    navMode,
    navigate,
    closeOverlay,
    onDone,
    canRedirect,
    viewName,
  ]);

  // The view closes the dialog by calling `onClose` (its `prevView`, e.g. a Cancel or an
  // `afterSave: 'prev'`). Mirror the backdrop's `onClose`: close *and* unmount the trigger via
  // `onDone`. Without the unmount the trigger stays mounted and its open effect re-fires on the next
  // render (e.g. after `refreshSchema`), reopening the reset dialog. `closeDialog` stays as a
  // fallback when there is no `onDone`.
  const handleViewClose = useCallback(() => {
    closeDialog();
    onDone?.();
  }, [closeDialog, onDone]);

  // The open/redirect decision below must run exactly once per activation (a fresh mount - callers
  // remount this component via a `key` bump to re-trigger it; see SchemaViewButton / row
  // activation). Several of the effect's own dependencies are not stable across that single mount
  // though: `navigate`'s own location update (and StrictMode's mount/cleanup/mount replay in dev)
  // can cause the effect to re-run before unmount catches up, replaying `navigate`/`openDialog`/
  // `changeView` a second time - e.g. a duplicated history entry that makes "back" a no-op once.
  // The ref makes the run-once intent explicit instead of relying on unmount timing.
  const hasRunRef = useRef(false);

  // One exclusive choice of surface, in priority order: dock, dialog, refuse, swap, redirect.
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    if (openMode === 'sidepanel') {
      sidePanel?.openView({
        resource,
        viewType,
        viewName,
        actionName,
        id: recordPk,
        data: params,
        target,
      });
      onDone?.();
    } else if (openMode === 'dialog') {
      // A dialog already on screen is reused: the view is swapped into it rather than stacking a
      // second one. Otherwise the dialog in the JSX below is opened.
      if (inDialog) {
        // This is the run-once mount action described above, not state derived from a render - it
        // may defer to `setPendingAction` (unsaved-changes guard) instead of swapping immediately.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        swapView();
      } else openDialog(params);
    } else if (mode === 'redirect') {
      // The action asked to leave for the target's own page; `redirect` reports one that cannot be.
      redirect();
    } else if (inDialog) {
      // It asked for no mode of its own, so `openMode` is the escape `resolveEffectiveMode` applies in
      // an overlay. Inside a dialog, swapping the view in place is that escape: the record is reached
      // without a route and nothing is stacked on top.
      swapView();
    } else {
      redirect();
    }
  }, [
    openMode,
    inDialog,
    canRedirect,
    mode,
    sidePanel,
    swapView,
    redirect,
    target,
    actionName,
    viewName,
    recordPk,
    resource,
    viewType,
    openDialog,
    onDone,
    params,
  ]);

  return (
    <>
      {pendingAction && (
        <UnsavedChangesDialog
          open
          onDiscard={() => {
            pendingAction();
            setPendingAction(null);
          }}
          onStay={() => setPendingAction(null)}
        />
      )}
      {openMode === 'dialog' && !inDialog && (
        <ViewDialog open={open} onClose={handleViewClose} dialogWidth={dialogWidth}>
          <SchemaViewRouter
            resource={resource}
            viewType={viewType}
            viewName={viewName}
            actionName={actionName}
            id={recordPk}
            data={data}
            onClose={handleViewClose}
            target={target}
          />
        </ViewDialog>
      )}
    </>
  );
};
