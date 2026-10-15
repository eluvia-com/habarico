import type {ColorType} from '@design/theme/core';
import {varAlpha} from '@design/theme/utils';
import type {CSSObject, Theme} from '@mui/material';
import {ACTIONS_FIELD} from './constants';

// Per-row semantic tinting: a row gets a `color-*` class (via `getRowClassName`) and its data cells
// take a soft tint of that palette color — as in the "List správ" screen.

/** Class applied to a row (via `getRowClassName`) to tint it with a semantic color. */
export const rowColorClass = (color: ColorType): string => `color-${color}`;

const TINT_COLORS: ColorType[] = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

/**
 * Whether a row's className string already carries a semantic tint class (`color-*`). Striping opts
 * out of tinted rows, so the semantic row colors stay untouched.
 */
export const isRowTinted = (className: string): boolean =>
  TINT_COLORS.some((color) => className.split(/\s+/).includes(rowColorClass(color)));

// Per-color row tint on the body cells, excluding the sticky actions cell (so the pinned
// column keeps its own background) — mirrors theme/core/components/TableRow.tsx.
export const rowTintSx = (theme: Theme): CSSObject =>
  Object.fromEntries(
    TINT_COLORS.map((color) => [
      `& .MuiDataGrid-row.${rowColorClass(color)} .MuiDataGrid-cell:not([data-field="${ACTIONS_FIELD}"])`,
      {backgroundColor: varAlpha(theme.palette[color].mainChannel, 0.08)},
    ])
  );
