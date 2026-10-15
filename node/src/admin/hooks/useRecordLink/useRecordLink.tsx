import React, {MouseEvent, ReactNode, useCallback} from 'react';
import {Identifier, useRecordContext, useResourceContext} from 'react-admin';
import {useNavigate} from 'react-router';
import {ViewDialog} from '@admin/components/views/ViewDialog';
import {ViewPresentation, useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {useGetLinkWithData} from '@admin/hooks/useGetLinkWithData';
import {useDialog} from '@design/hooks/useDialog';
import {getNavigationMode, openByMode} from '@foundation/utils/navigation';

export type RecordLinkViewType = 'show' | 'edit';

// Shared by `changeView` (in-place navigation) and `openSidePanel` (docking) — both just need to
// know which record to open and as which view.
export type RecordLinkOpenProps = {
  resource: string;
  viewType: RecordLinkViewType;
  viewName: string;
  id: Identifier;
};

export type RecordLinkContentProps = {
  resource: string;
  viewType: RecordLinkViewType;
  id: Identifier;
  data?: Record<string, string>;
  onClose: () => void;
};

export type UseRecordLinkProps = {
  viewType?: RecordLinkViewType;
  keepLinkedParent?: boolean;
  // The surface to open the link's target in — reuses `ViewPresentation` since it is the same
  // concept: which surface (page / dialog / panel) hosts the target view.
  linkMode?: ViewPresentation;
  dialogWidth?: string;
  // In-place navigation for a link opened while already inside a dialog: the dialog on screen is
  // reused and its view swapped, rather than a second one stacked on top. Required for a dialog
  // surface — the schema layer supplies the view router's own (see `useSchemaRecordLinkOptions`) and
  // it cannot fail there. Not used inside a side panel — see `openSidePanel`.
  changeView?: (props: RecordLinkOpenProps) => boolean;
  // Docks the record into a side panel instead of opening a dialog, when `linkMode="panel"`. That
  // includes a link fired from inside the panel: the panel is the surface the user is looking at,
  // so the target lands there rather than in a dialog stacked on top of it. Return `true` when
  // handled (e.g. a panel controller is actually mounted); a falsy return falls back to the dialog —
  // a legitimate runtime case (no panel to dock into here), not an error.
  openSidePanel?: (props: RecordLinkOpenProps) => boolean;
  // Closes the overlay this link fired from, after it navigated away from it. Nothing else does:
  // the overlay's open state is owned by the surface underneath, which React keeps mounted when
  // only the route params change, so it would hang over the page just opened. Absent on a page
  // surface - there is no overlay there - so the call below is unconditional.
  closeOverlay?: () => void;
  // Renders the dialog body for `linkMode="dialog"` and as the `openSidePanel` fallback for
  // `linkMode="panel"`.
  renderContent?: (props: RecordLinkContentProps) => ReactNode;
};

export const useRecordLink = ({
  viewType,
  keepLinkedParent = false,
  linkMode,
  dialogWidth,
  changeView,
  openSidePanel,
  closeOverlay,
  renderContent,
}: UseRecordLinkProps) => {
  const record = useRecordContext();
  // Hoisted: React Compiler infers `record` for an inline `record?.id`, which is less specific
  // than the dependency we want, so it refuses to preserve the memoization below.
  const recordId = record?.id;
  const resource = useResourceContext();
  const getLink = useGetLinkWithData(resource);

  const navigate = useNavigate();
  const {open, openDialog, data, closeDialog} = useDialog<Record<string, string>>();
  const {presentation} = useViewPresentation();
  // `changeView` only applies inside a dialog (swaps its already-rendered content in place); a side
  // panel swaps by being told to open the record again, so it must not be treated the same way here.
  const inDialog = presentation === 'dialog';

  const wantsOverlay = linkMode === 'dialog' || linkMode === 'panel';

  // Returns whether this tab actually navigated: a new tab/window (ctrl/cmd-click) leaves this one
  // where it is, and so leaves any overlay the link fired from open.
  const redirect = useCallback(
    (e: MouseEvent) => {
      if (!recordId || !resource || !viewType) return false;

      const url = getLink({type: viewType, resource, id: recordId, keepLinkedParent});
      if (!url) return false;
      const selectedNavigationMode = getNavigationMode(e);
      if (selectedNavigationMode && openByMode(url, selectedNavigationMode)) return false;
      navigate(url);
      return true;
    },
    [recordId, resource, viewType, getLink, keepLinkedParent, navigate]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      if (!recordId || !resource || !viewType) return;
      const openProps: RecordLinkOpenProps = {
        resource,
        viewType,
        viewName: viewType,
        id: recordId,
      };

      if (wantsOverlay) {
        // A panel target docks whenever there is a panel to dock into; a falsy return means there
        // is none, and the dialog below is the fallback.
        if (linkMode === 'panel' && openSidePanel?.(openProps)) return;
        // A dialog already on screen is reused: the view is swapped into it rather than stacking a
        // second one. No fallback to a redirect - the link asked for an overlay, and navigating
        // instead would answer with a different surface than the one requested (the view trigger
        // handles its dialog surface the same way).
        if (inDialog) {
          if (changeView) changeView(openProps);
          else
            console.warn(
              `useRecordLink: linkMode="${linkMode}" inside a dialog needs "changeView" to swap the view in place. The link does nothing.`
            );
          return;
        }
        openDialog();
        return;
      }

      // The target is the record's own page. Reaching it from an overlay leaves that overlay
      // behind, so it is closed - otherwise it hangs over the page just opened.
      if (redirect(e)) closeOverlay?.();
    },
    [
      wantsOverlay,
      inDialog,
      changeView,
      linkMode,
      openSidePanel,
      resource,
      viewType,
      recordId,
      openDialog,
      redirect,
      closeOverlay,
    ]
  );

  if (!(viewType && record && resource)) {
    return {handleClick: undefined, dialog: null};
  }

  if (wantsOverlay && !renderContent) {
    throw new Error(
      `useRecordLink: linkMode="${linkMode}" requires "renderContent" to render the overlay, but none was provided.`
    );
  }

  return {
    handleClick,
    dialog: (
      <>
        {renderContent && (
          <ViewDialog open={open} onClose={closeDialog} dialogWidth={dialogWidth}>
            {renderContent({resource, viewType, id: record.id, data, onClose: closeDialog})}
          </ViewDialog>
        )}
      </>
    ),
  };
};
