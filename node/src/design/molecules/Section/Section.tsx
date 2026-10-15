import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';

export type SectionProps = {
  /** Section content — typically a `SectionHeader` followed by the body. */
  children: React.ReactNode;
  /**
   * When `true`, the section stretches to fill its container's height (`height: 100%`) — e.g. so
   * its body (a list/datagrid) reaches the bottom of a grid cell. Off by default, so the section
   * keeps its natural height. Mirrors `Panel`'s `fullHeight`.
   */
  fullHeight?: boolean;
  /** Extra styles merged onto the section container. */
  sx?: SxProps<Theme>;
};

/**
 * Lightweight, card-less counterpart to `Panel` — a plain flex-column container with no
 * surface of its own (no border, shadow, background or body padding) that still groups a
 * titled `SectionHeader` (label + actions) with full-bleed content. Use it where a `Panel`'s
 * card chrome would be too heavy: an inline group inside another panel, or a bare
 * action-only header sitting above a datagrid/list. Purely presentational and schema-agnostic.
 *
 * Keeps its natural height by default; pass `fullHeight` to stretch it to fill a grid cell (the
 * parent grid still decides whether the cell itself grows). Compose a `SectionHeader` as the
 * first child and the body after it:
 *
 * ```tsx
 * <Section fullHeight>
 *   <SectionHeader label={'Items'} actions={<Button>Add</Button>} />
 *   <Datagrid />
 * </Section>
 * ```
 */
export const Section = ({children, fullHeight = false, sx}: SectionProps) => (
  <Box
    className={'Section'}
    sx={{
      width: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      ...(fullHeight && {height: '100%'}),
      ...sx,
    }}
  >
    {children}
  </Box>
);
