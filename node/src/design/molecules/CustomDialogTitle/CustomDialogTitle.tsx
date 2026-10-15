import React from 'react';
import {DialogTitle, Stack, SxProps, Theme, Typography, useTheme} from '@mui/material';

export type CustomDialogTitleProps = {
  /** Primary title, rendered as a bold `h6`. */
  title: React.ReactNode;
  /** Optional muted subtitle under the title (`body2`, `text.secondary`), e.g. "pro nemovitost …". */
  subtitle?: React.ReactNode;
  /**
   * Optional right-aligned actions slot pinned to the first line, e.g. an "Editovat" button plus a
   * `⋮` overflow menu. Sits left of the dialog's floating close button.
   */
  actions?: React.ReactNode;
  /** When `true`, draws a divider under the header. Defaults to `false`. */
  divider?: boolean;
  /** Extra styles merged onto the `DialogTitle` root. */
  sx?: SxProps<Theme>;
};

/**
 * Standardized dialog header — a bold title, an optional muted subtitle and a right-aligned actions
 * slot, with an optional bottom divider. Rendered as a MUI `DialogTitle` (as a `div`, so it does not
 * force a heading around the title), so it inherits the theme's dialog-title padding — including the
 * right gutter that clears the floating close button — and composes MUI-style as the first child of a
 * `CustomDialog` (or any MUI `Dialog`), before `DialogContent` / `DialogActions`.
 */
export const CustomDialogTitle = ({
  title,
  subtitle,
  actions,
  divider = false,
  sx,
}: CustomDialogTitleProps) => {
  const theme = useTheme();

  // The theme's own `padding-bottom: 0` for `.MuiDialogTitle-root` (`MuiDialog`'s
  // `styleOverrides.root`, `'& .MuiDialogTitle-root': {...}` in `Dialog.tsx`) is a descendant
  // selector nested under the dialog root's own generated class — two class-level selectors, the
  // same specificity as a compound selector on this element. A plain `sx` padding-bottom here is
  // only ever one class, so it loses that fight regardless of source order — the override below
  // repeats `.MuiDialogTitle-root` on the element itself (`&.MuiDialogTitle-root`) to match that
  // specificity and actually take effect. Needed whenever there's a divider to clear (`divider`)
  // or an action taller than the title line that would otherwise sit flush against the header's
  // own bottom edge (`actions`) — the plain top padding above it stays fine either way.
  let pb;
  if (divider) {
    pb = 2;
  } else if (actions) {
    pb = 1;
  } else {
    pb = undefined;
  }

  return (
    <DialogTitle
      component={'div'}
      sx={[
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          // When a divider is shown, give it room above the line and — since MUI zeroes the
          // following DialogContent's padding-top — a margin below the line (`mb`) so the
          // content clears the divider. `pb` itself is handled by the specificity-matching
          // override below.
          ...(divider ? {mb: 2, borderBottom: `1px dashed ${theme.palette.divider}`} : {}),
        },
        pb !== undefined && {'&.MuiDialogTitle-root': {pb}},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack sx={{flexGrow: 1, minWidth: 0}}>
        <Typography variant={'h5'} sx={{overflowWrap: 'anywhere'}}>
          {title}
        </Typography>
        {subtitle != null && subtitle !== '' && (
          <Typography variant={'body2'} sx={{color: 'divider'}}>
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actions && (
        <Stack direction={'row'} spacing={1} alignItems={'center'} sx={{flexShrink: 0}}>
          {actions}
        </Stack>
      )}
    </DialogTitle>
  );
};
