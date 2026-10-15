import React from 'react';
import {Box, Stack, SxProps, Theme} from '@mui/material';

export type NavigationHeaderProps = {
  /**
   * The navigation strip — typically a MUI `<Tabs>` (tab box) or `<Stepper>` (wizard box). It fills
   * the row and scrolls when it overflows, so a `variant="scrollable"` `Tabs` needs no width styling
   * of its own (the header supplies the growing, min-width-0 slot the scroll behaviour relies on).
   */
  children: React.ReactNode;
  /**
   * Optional actions rendered flush to the right of the strip (e.g. buttons / an overflow menu). The
   * header adds no padding of its own — the actions sit against the right edge; any inset is the
   * consumer's to add via `sx`.
   */
  actions?: React.ReactNode;
  /** Extra styles merged onto the header row. */
  sx?: SxProps<Theme>;
};

/**
 * A header row that carries a horizontal navigation strip — a `<Tabs>` or a `<Stepper>` — and an
 * optional right-aligned actions slot. The navigation-strip counterpart to {@link SectionHeader}:
 * where `SectionHeader` leads with a label, this leads with the strip itself, which takes the
 * available width and scrolls, while the actions stay pinned to the right. Card-less and fully flush
 * (no surface, no divider, no padding), so it drops straight onto a page background or into a card
 * body.
 */
export const NavigationHeader = ({children, actions, sx}: NavigationHeaderProps) => (
  <Stack className={'NavigationHeader'} direction={'row'} spacing={1} alignItems={'center'} sx={sx}>
    {/* The growing, min-width-0 slot a scrollable strip needs to size and scroll within the row. */}
    <Box sx={{flexGrow: 1, minWidth: 0}}>{children}</Box>
    {actions && (
      <Stack direction={'row'} spacing={0.5} alignItems={'center'} sx={{flexShrink: 0}}>
        {actions}
      </Stack>
    )}
  </Stack>
);
