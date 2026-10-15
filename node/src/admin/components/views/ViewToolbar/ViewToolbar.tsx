import React from 'react';
import {Toolbar as RaToolbar, ToolbarClasses} from 'react-admin';
import {SxProps, Theme} from '@mui/material/styles';

export type ViewToolbarProps = {
  /** The action buttons to lay out (right-aligned, gap between them). */
  children?: React.ReactNode;
  /** Extra styles merged onto the toolbar. */
  sx?: SxProps<Theme>;
};

// Our shared bottom-toolbar styling — a transparent, right-aligned action bar used at the bottom of
// both the form (`FormShell`, as the `SimpleForm` toolbar) and the detail view (`ShowShell`, as the
// `bottomActions` bar). Built on React Admin's `Toolbar` so the form keeps React Admin's toolbar
// wiring; the sx neutralises RA's paper background and its below-`sm` `position: fixed` behaviour so
// the bar stays transparent and in normal flow everywhere (HAB-604).
const toolbarSx = (theme: Theme): SxProps<Theme> => ({
  justifyContent: 'flex-end',
  gap: 1,
  [theme.breakpoints.up('sm')]: {px: 0, py: 2, minHeight: 0},
  backgroundColor: 'transparent',
  [`&.${ToolbarClasses.mobileToolbar}`]: {
    position: 'static',
    width: 'auto',
    zIndex: 'auto',
    padding: 0,
    px: 1,
    pb: 1,
    minHeight: 0,
  },
  // When the actions render nothing (e.g. an empty bottom_actions list, or a list that resolves to
  // no valid buttons) don't leave an empty padded bar.
  '&:empty': {display: 'none'},
});

/**
 * The admin-layer view bottom action bar. Right-aligns its button children in a transparent, in-flow
 * toolbar and collapses itself when it has no rendered content. Shared by `FormShell` and `ShowShell`
 * so form and detail views get an identical actions bar.
 *
 * Pass the buttons as children; the bar owns only the layout (alignment, spacing, padding). Note it
 * must always receive at least one child element — React Admin's `Toolbar` injects a default
 * save/delete bar when given none — so callers render it conditionally rather than empty.
 */
export const ViewToolbar = ({children, sx}: ViewToolbarProps) => (
  <RaToolbar sx={[toolbarSx, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}>
    {children}
  </RaToolbar>
);
