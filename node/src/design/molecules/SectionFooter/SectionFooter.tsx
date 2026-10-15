import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';

export type SectionFooterProps = {
  /** Left-aligned content (e.g. a back / prev button). */
  left?: React.ReactNode;
  /** Right-aligned content (e.g. action buttons). */
  right?: React.ReactNode;
  /** Extra styles merged onto the footer row. */
  sx?: SxProps<Theme>;
};

/**
 * Card-less counterpart to `PanelFooter` — the footer of a `Section`. A `left`/`right` slot row
 * (`space-between`; a right-only footer collapses to the right) with no surface, no divider and no
 * padding of its own (the consumer supplies any inset via `sx`). Mirrors the schema `BoxToolbar`.
 */
export const SectionFooter = ({left, right, sx}: SectionFooterProps) => (
  <Box
    className={'SectionFooter'}
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 1,
      width: '100%',
      ...sx,
    }}
  >
    <Box sx={{display: 'flex', gap: 1}}>{left}</Box>
    <Box sx={{display: 'flex', gap: 1}}>{right}</Box>
  </Box>
);
