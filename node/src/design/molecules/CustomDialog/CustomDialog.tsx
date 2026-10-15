import React from 'react';
import {Dialog as MuiDialog, DialogProps as MuiDialogProps, SxProps, Theme} from '@mui/material';
import {CloseButton} from '../../atoms/CloseButton';

export type CustomDialogProps = Omit<MuiDialogProps, 'onClose'> & {
  /** Called when the dialog is dismissed (backdrop / escape / close button), unless `disableClose`. */
  onClose?: () => void;
  /** When `true`, hides the close button and disables backdrop / escape dismissal. */
  disableClose?: boolean;
  /**
   * Exact paper width — a number (px) or any CSS length. When set it pins `.MuiDialog-paper` to this
   * width and takes precedence over `maxWidth` (which MUI's breakpoint presets otherwise cap): the
   * dialog is forced to `maxWidth={false}` and the paper grows to `width` (still `fullWidth` inside).
   */
  width?: number | string;
  /** Styles merged onto the floating close button. */
  closeButtonSx?: SxProps;
};

// Wraps a dialog-level mouse handler so the event stops bubbling before it leaves the dialog.
// A dialog opened from inside a clickable row (a datagrid cell, a list item) is a React descendant
// of it, but MUI portals the dialog's DOM to `document.body` — and React bubbles synthetic events
// along the JSX tree, not the DOM tree. Without this, a click anywhere in the dialog would reach
// that row's `onClick` / `onDoubleClick` and activate it behind the open dialog. Stopped here, at
// the dialog boundary, so no call site has to wrap its trigger. `onMouseDown` is deliberately left
// through: `DatagridRow`'s row-hint Tooltip closes itself via a `mousedown` on the row above, and
// that must still get there.
const stopBubbling =
  (handler?: React.MouseEventHandler<HTMLDivElement>): React.MouseEventHandler<HTMLDivElement> =>
  (event) => {
    event.stopPropagation();
    handler?.(event);
  };

/**
 * A thin, controlled wrapper over the MUI `Dialog` that adds the standardized floating close button
 * (unless `disableClose`) and otherwise keeps MUI's composition contract: compose the body from
 * `CustomDialogTitle` / `DialogContent` / `DialogActions` children. Purely presentational — the caller
 * (or the `useDialog` hook) owns the `open` state.
 */
export const CustomDialog = ({
  children,
  open,
  onClose,
  disableClose,
  closeButtonSx,
  width,
  maxWidth,
  sx,
  onClick,
  onDoubleClick,
  ...rest
}: CustomDialogProps) => {
  // An exact `width` overrides the breakpoint preset: uncap `maxWidth` and pin the paper. Merge our
  // paper rule ahead of the caller's `sx` (array form) so a caller override still wins.
  const mergedSx: MuiDialogProps['sx'] =
    width !== undefined
      ? [
          {'& .MuiDialog-paper': {maxWidth: width, width: '100%'}} as SxProps<Theme>,
          ...(Array.isArray(sx) ? sx : [sx]),
        ]
      : sx;

  return (
    <MuiDialog
      open={open}
      onClose={() => {
        if (!disableClose) onClose?.();
      }}
      maxWidth={width !== undefined ? false : maxWidth}
      sx={mergedSx}
      onClick={stopBubbling(onClick)}
      onDoubleClick={stopBubbling(onDoubleClick)}
      {...rest}
    >
      {!disableClose && (
        <CloseButton
          sx={closeButtonSx}
          onClick={() => {
            if (!disableClose) onClose?.();
          }}
        />
      )}
      {children}
    </MuiDialog>
  );
};
