import React, {ReactNode, useState} from 'react';
import {SidePanelContext} from '@admin/contexts/SidePanelContext';
import {
  ViewPresentationProvider,
  useOverlayPresentation,
} from '@admin/contexts/ViewPresentationContext';
import {InsidePanelContextProvider} from '@design/contexts/InsidePanelContext';
import {CustomDialog, resolveDialogWidth} from '@design/molecules/CustomDialog';
import {CustomDialogTitle} from '@design/molecules/CustomDialogTitle';
import {PropertyListContext} from '@design/molecules/PropertyList';
import {Box, Breakpoint, DialogActions, DialogContent} from '@mui/material';

export type ViewDialogProps = {
  children: ReactNode;
  open: boolean;
  /** Called when the dialog is dismissed (close button / backdrop / escape), unless `disableClose`. */
  onClose?: () => void;
  /** When `true`, hides the close button and disables backdrop / escape dismissal. */
  disableClose?: boolean;
  /**
   * The schema-style dialog width string: a MUI breakpoint key (`'sm'`…) or an exact px width
   * (`'720'` / `'720px'`). Resolved via `resolveDialogWidth` — it wins over `maxWidth` and also
   * drives compact (stacked) property lists at narrow widths. Omit to use `maxWidth`.
   */
  dialogWidth?: string;
  maxWidth?: Breakpoint | false;
  fullWidth?: boolean;
};

// An empty placeholder collapses to zero height so an unfilled header/footer slot leaves no gap
// (mirrors the `:empty` hide pattern used by the production dialog in `SchemaViewActionTrigger`).
const collapseWhenEmpty = {'&:empty': {display: 'none'}} as const;

// The dialog toolbar (view action bars portaled into the header/footer) gets uniform padding — the
// same `p: 2` the inline schema dialog scaffolding applied for parity. Scoped to the header and the
// footer: a bare `.MuiToolbar-root` also reached the toolbars *inside* the content — a nested list
// box's action bar and its pagination — and padded them 16px on every side.
const toolbarPadding = {
  '& .MuiDialogTitle-root .MuiToolbar-root, & .MuiDialogActions-root .MuiToolbar-root': {p: 2},
} as const;

// A compact dialog stacks its property lists (label above the input); a stable module constant so it
// doesn't re-trigger the context on every render.
const STACKED_PROPERTY_LISTS = {orientation: 'vertical'} as const;
const AUTO_PROPERTY_LISTS = {} as const;

/**
 * Reusable admin-layer shell for CRUD dialogs, built on the design molecules `CustomDialog` /
 * `CustomDialogTitle` / `DialogActions`. It owns four portal placeholders — **title, subtitle,
 * toolbar actions, and bottom actions** — and exposes them through a `ViewPresentationContext`
 * marked `presentation: 'dialog'`.
 *
 * A `ViewContent` rendered inside (directly or via a view shell like `CreateShell`) portals its
 * title / subtitle / toolbar actions into the header and the form/detail action bar into the footer.
 * On a page the same `ViewContent` instead portals into `DashboardLayout` via `LayoutDynamicContext`
 * — the surface is chosen entirely by which presentation is in context. The single dialog surface
 * behind both schema dialog sites (`SchemaViewActionTrigger` / `SchemaRecordLink`) and generic
 * callers (HAB-759 / HAB-668).
 */
export const ViewDialog = ({
  children,
  open,
  onClose,
  disableClose,
  dialogWidth,
  maxWidth = 'md',
  fullWidth = true,
}: ViewDialogProps) => {
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
  const [subtitleEl, setSubtitleEl] = useState<HTMLElement | null>(null);
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
  const [bottomActionsEl, setBottomActionsEl] = useState<HTMLElement | null>(null);

  // A schema `dialogWidth` overrides the generic `maxWidth`; a bare `maxWidth` caller keeps its value.
  const resolved = dialogWidth !== undefined ? resolveDialogWidth(dialogWidth) : undefined;
  const isCompact = resolved?.isCompact ?? false;

  const presentation = useOverlayPresentation({
    presentation: 'dialog',
    titleEl,
    subtitleEl,
    actionsEl,
    bottomActionsEl,
  });

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      disableClose={disableClose}
      maxWidth={resolved ? resolved.maxWidth : maxWidth}
      width={resolved?.width}
      fullWidth={fullWidth}
      sx={toolbarPadding}
    >
      <CustomDialogTitle
        // Placeholders render as block `span`s so they stay valid inside `CustomDialogTitle`'s
        // Typography wrappers (its subtitle is a `<p>`, which may not contain a `<div>`).
        title={<Box component="span" ref={setTitleEl} sx={{display: 'block', minWidth: 0}} />}
        subtitle={
          <Box component="span" ref={setSubtitleEl} sx={{display: 'block', ...collapseWhenEmpty}} />
        }
        actions={
          <Box
            component="span"
            ref={setActionsEl}
            sx={{display: 'flex', alignItems: 'center', gap: 1, ...collapseWhenEmpty}}
          />
        }
      />
      <DialogContent>
        {/* A compact (narrow) dialog forces property lists into the stacked (label-above-input) form
            the width-driven `auto` layout only reaches at ~320px — a wider dialog keeps `auto`. */}
        <PropertyListContext.Provider
          value={isCompact ? STACKED_PROPERTY_LISTS : AUTO_PROPERTY_LISTS}
        >
          {/* The dialog's own Paper is the card the content sits on, so everything inside starts
              inside a panel: a nested Panel renders flat and a root box draws no card of its own. */}
          <InsidePanelContextProvider value={true}>
            {/* A dialog owns no docked side panel. The nearest `SidePanelProvider` belongs to the
                list *behind* the dialog (React context reaches through the MUI portal), so a
                `sidepanel` action fired in here would fill another surface's panel and leave the
                dialog stacked over it. Reset the controller to the no-panel default instead - the
                triggers then fall back to a dialog on their own. Content that brings its own panel
                (a full list mounts one in `ListShell`) re-provides it below this boundary. */}
            <SidePanelContext.Provider value={undefined}>
              <ViewPresentationProvider value={presentation}>{children}</ViewPresentationProvider>
            </SidePanelContext.Provider>
          </InsidePanelContextProvider>
        </PropertyListContext.Provider>
      </DialogContent>
      {/* The view's action bar portals here (see `ViewContent` / `FormShell`). Collapses until
          something is portaled in, so an actionless view shows no empty footer. */}
      <DialogActions ref={setBottomActionsEl} sx={collapseWhenEmpty} />
    </CustomDialog>
  );
};
