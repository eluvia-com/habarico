/* eslint-disable react-refresh/only-export-components */
// Shared Storybook presentation kit for the design layer. NOT a story file and
// NOT exported from the design barrel (`src/design/index.ts`) — it must never
// ship in the library bundle. Every `*.stories.tsx` in the design layer imports
// from here to get a consistent documentation/presentation style.
//
// Importing `@design/theme/core` here is deliberate: it pulls the MUI theme module
// augmentations (palette.*.lighter, theme.customShadows, theme.radius,
// theme.iconSet) into every story that imports this kit — story files are
// excluded from tsconfig and don't get them transitively otherwise. The tokens
// are re-exported so stories don't need a second `@design/theme/core` import.
import React from 'react';
import {Box, Stack, Typography} from '@mui/material';
import type {Decorator} from '@storybook/react-vite';
import {COLOR_TYPES, type ColorType} from './theme/core';

export {COLOR_TYPES};
export type {ColorType};

// Semantic colors including the "default" (undefined) slot, for Colors showcases.
export const SHOWCASE_COLORS: (ColorType | undefined)[] = [undefined, ...COLOR_TYPES];

/** Standard padding decorator — replaces the ad-hoc `<Box m={2}>` in every meta. */
export const padDecorator: Decorator = (Story) => (
  <Box sx={{m: 2}}>
    <Story />
  </Box>
);

/** Vertical stack of showcase groups. */
export const Showcase = ({
  spacing = 3,
  children,
}: {
  spacing?: number;
  children: React.ReactNode;
}) => <Stack spacing={spacing}>{children}</Stack>;

/** Wrapping horizontal row of examples. */
export const Row = ({
  spacing = 2,
  align = 'center',
  children,
}: {
  spacing?: number;
  /** Cross-axis alignment of the items (defaults to vertically centered). */
  align?: React.CSSProperties['alignItems'];
  children: React.ReactNode;
}) => (
  <Stack direction={'row'} spacing={spacing} flexWrap={'wrap'} useFlexGap alignItems={align}>
    {children}
  </Stack>
);

/** Titled block with an optional description — the unit of a showcase story. */
export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Stack spacing={1.5}>
    <Box>
      <Typography variant={'subtitle2'}>{title}</Typography>
      {description && (
        <Typography variant={'body2'} color={'text.secondary'} sx={{mt: 0.5}}>
          {description}
        </Typography>
      )}
    </Box>
    {children}
  </Stack>
);

/** Secondary (row) axis for a two-dimensional {@link VariantGrid}. */
export interface VariantGridAxis<S> {
  items: readonly S[];
  keyOf: (item: S) => string;
  label?: (item: S) => React.ReactNode;
}

/**
 * Labeled matrix — one cell per item, optional caption above each. Powers the
 * Variants / Colors / Sizes / States showcases. `keyOf` must return a string so
 * cells with an `undefined` value (e.g. default color) still get a stable key.
 *
 * Pass `secondary` to add a second dimension: the primary `items` become the
 * columns and the secondary items the rows, with `render(item, secondaryItem)`
 * filling each cell (e.g. colors × variants). Without it the grid stays the
 * single-row showcase and `render` receives only the primary item.
 */
export function VariantGrid<T, S = undefined>({
  items,
  keyOf,
  label,
  render,
  align = 'center',
  secondary,
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  label?: (item: T) => React.ReactNode;
  render: (item: T, secondaryItem: S) => React.ReactNode;
  /** Cross-axis alignment of the cells (defaults to vertically centered). */
  align?: React.CSSProperties['alignItems'];
  /** Optional second (row) dimension — turns the showcase into a matrix. */
  secondary?: VariantGridAxis<S>;
}) {
  if (!secondary) {
    return (
      <Row align={align}>
        {items.map((item) => (
          <Stack key={keyOf(item)} spacing={1} alignItems={'flex-start'}>
            {label && (
              <Typography variant={'caption'} color={'text.secondary'}>
                {label(item)}
              </Typography>
            )}
            {render(item, undefined as S)}
          </Stack>
        ))}
      </Row>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-grid',
        gridTemplateColumns: `auto repeat(${items.length}, max-content)`,
        columnGap: 2,
        rowGap: 1.5,
        alignItems: align,
      }}
    >
      {/* Header row: empty corner + primary (column) labels. */}
      <Box />
      {items.map((item) => (
        <Typography key={keyOf(item)} variant={'caption'} color={'text.secondary'}>
          {label?.(item)}
        </Typography>
      ))}
      {/* Body: one row per secondary item, prefixed by its label. */}
      {secondary.items.map((secondaryItem) => (
        <React.Fragment key={secondary.keyOf(secondaryItem)}>
          <Typography
            variant={'caption'}
            color={'text.secondary'}
            sx={{alignSelf: 'center', pr: 1}}
          >
            {secondary.label?.(secondaryItem)}
          </Typography>
          {items.map((item) => (
            <Box key={keyOf(item)}>{render(item, secondaryItem)}</Box>
          ))}
        </React.Fragment>
      ))}
    </Box>
  );
}

/** Color swatch — a labeled color block with an optional value caption. */
export const Swatch = ({color, label, value}: {color: string; label: string; value?: string}) => (
  <Box sx={{minWidth: 104}}>
    <Box
      sx={{
        height: 48,
        borderRadius: 1,
        bgcolor: color,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    />
    <Typography variant={'caption'} display={'block'} sx={{mt: 0.5}}>
      {label}
    </Typography>
    {value && (
      <Typography
        variant={'caption'}
        color={'text.secondary'}
        display={'block'}
        sx={{fontFamily: 'monospace'}}
      >
        {value}
      </Typography>
    )}
  </Box>
);
