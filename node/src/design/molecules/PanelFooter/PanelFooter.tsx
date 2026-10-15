import React from 'react';
import {Box, CardActions, SxProps, Theme} from '@mui/material';

export type PanelFooterProps = {
  /** Left-aligned content (e.g. a back / prev button). */
  left?: React.ReactNode;
  /** Right-aligned content (e.g. cancel / save actions). */
  right?: React.ReactNode;
  /** Extra styles merged onto the footer row. */
  sx?: SxProps<Theme>;
};

/**
 * Panel footer — an action bar separated from the body by a dashed divider, with a `left` and a
 * `right` slot (`space-between`; a right-only footer collapses to the right, like `DialogActions`).
 * Built on MUI `CardActions`. Rendered as the last slot inside a `Panel`.
 */
export const PanelFooter = ({left, right, sx}: PanelFooterProps) => (
  <CardActions
    sx={{
      borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
      px: 1.25,
      py: 1.25,
      justifyContent: 'space-between',
      gap: 1,
      ...sx,
    }}
  >
    <Box sx={{display: 'flex', gap: 1}}>{left}</Box>
    <Box sx={{display: 'flex', gap: 1}}>{right}</Box>
  </CardActions>
);
