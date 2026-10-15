import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';

export type SectionContentProps = {
  children: React.ReactNode;
  /** Stretch to fill the section height (`flex-grow: 1`) so a list/datagrid can reach the bottom. */
  fullHeight?: boolean;
  /** Extra styles merged onto the content container. */
  sx?: SxProps<Theme>;
};

/**
 * Card-less counterpart to `PanelContent` — the body region of a `Section`. A plain flex-column
 * `Box` with no surface and, unlike `PanelContent`, no padding of its own: a `Section` is always
 * invisible, so its body sits flush and any spacing is owned by the surrounding layout (the parent
 * grid gap, or the inner boxes' own surfaces). Only `fullHeight` and `sx` are configurable.
 */
export const SectionContent = ({children, fullHeight = false, sx}: SectionContentProps) => (
  <Box
    className={'SectionContent'}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      ...(fullHeight && {flexGrow: 1}),
      ...sx,
    }}
  >
    {children}
  </Box>
);
