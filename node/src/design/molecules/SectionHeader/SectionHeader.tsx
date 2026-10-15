import React from 'react';
import {Box, CircularProgress, Stack, SxProps, Theme, Typography} from '@mui/material';

// Match PanelHeader's line-box height so a Section header and a Panel header share the same
// vertical rhythm and line up when placed near each other.
const LINE_BOX = 32;

// A small spinner sized to sit on the label's baseline rhythm without dominating it.
const SPINNER_SIZE = 16;

export type SectionHeaderProps = {
  /**
   * Section title. Optional — omit it (and pass only `actions`) to render a bare
   * action-only header, e.g. a toolbar sitting above a card-less list.
   */
  label?: React.ReactNode;
  /** Optional actions rendered on the right (e.g. buttons / an overflow menu). */
  actions?: React.ReactNode;
  /**
   * When `true`, a small spinner appears next to the title to signal a background operation. It
   * lives in a reserved slot and fades in/out, so toggling it never covers the label nor shifts the
   * row (a card-less Section has no bottom edge for a progress bar, so it uses a spinner rather than
   * `PanelHeader`'s bar). Defaults to `false`.
   */
  loading?: boolean;
  /** Extra styles merged onto the header row. */
  sx?: SxProps<Theme>;
};

/**
 * Header for a `Section` — a label and an optional right-aligned actions slot. The row keeps a
 * {@link LINE_BOX}px line box (top-aligned) so it lines up with a `PanelHeader`, but unlike
 * `PanelHeader` it is card-less and fully flush: no padding of its own (the `Section` adds none
 * either), no surface, no bottom divider and no collapse toggle / icon / help affordance (those
 * belong to `Panel`). Any inset is the consumer's to add via `sx`.
 */
export const SectionHeader = ({label, actions, loading = false, sx}: SectionHeaderProps) => (
  <Stack
    className={'SectionHeader'}
    direction={'row'}
    spacing={1}
    alignItems={'flex-start'}
    sx={{
      // Match the header rhythm: action icon buttons fill the line box exactly.
      '& .MuiIconButton-root': {width: LINE_BOX, height: LINE_BOX},
      ...sx,
    }}
  >
    {label && (
      <Typography
        variant={'subtitle1'}
        fontWeight={'fontWeightBold'}
        sx={{minWidth: 0, lineHeight: `${LINE_BOX}px`}}
      >
        {label}
      </Typography>
    )}
    {/*
      Loading spinner in a fixed reserved slot hugging the title. It fades in/out rather than mounting
      on demand, so toggling `loading` never covers the label nor reflows the row (no layout shift).
      `aria-hidden` while idle keeps the empty slot out of the accessibility tree.
    */}
    <Box
      aria-hidden={!loading}
      sx={{
        height: LINE_BOX,
        width: SPINNER_SIZE,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 1 : 0,
        transition: 'opacity 150ms linear',
      }}
    >
      <CircularProgress size={SPINNER_SIZE} />
    </Box>
    {actions && (
      // `ml: auto` right-aligns the actions even in the label-less (action-only) header.
      <Stack
        direction={'row'}
        spacing={0.5}
        alignItems={'center'}
        sx={{minHeight: LINE_BOX, flexShrink: 0, ml: 'auto'}}
      >
        {actions}
      </Stack>
    )}
  </Stack>
);
