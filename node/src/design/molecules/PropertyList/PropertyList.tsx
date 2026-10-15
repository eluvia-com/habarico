import React, {useContext, useMemo} from 'react';
import {Box, SxProps, Theme, Typography} from '@mui/material';
import {DENSITY_GRID_GAP} from '../../constants';
import type {
  PropertyLabelWidth,
  PropertyLineHeight,
  PropertyOrientation,
} from '../PropertyItem/PropertyItem';
import {
  PropertyListContext,
  type PropertyListContextValue,
  type PropertyListDensity,
} from './PropertyListContext';

export type {PropertyListDensity};

export type PropertyListProps = {
  /**
   * Number of value columns on `sm` and up (always 1 on `xs`). Combined with each
   * `PropertyItem`'s `auto` orientation this drives the read layouts: `columns={1}`
   * yields wide inline rows (label beside value), `columns={2}` yields narrow stacked
   * cells (label above value).
   */
  columns?: number;
  /** Horizontal gap between columns (theme spacing units). Defaults to `4`. */
  columnGap?: number;
  /**
   * Vertical gap between rows (theme spacing units). When omitted it is derived from `density`
   * (`compact` → 2, `standard` → 3, `comfortable` → 4); set it to override that per list.
   */
  rowGap?: number;
  /**
   * Row density — scales the vertical gap between rows, with the same `'compact' | 'standard' |
   * 'comfortable'` semantics as `DataTable`, so a global density setting passes straight through.
   * Defaults to `compact` (the current tight spacing). Cascades to nested `PropertyList`s, and is
   * ignored when `rowGap` is set explicitly.
   */
  density?: PropertyListDensity;
  /**
   * Default `lineHeight` for every `PropertyItem` in this list (they can still override it) —
   * so an edit form aligns all its horizontal labels to the input height in one place. Use
   * `smallInput` for size-`small` fields. Only affects the horizontal (label-beside) layout.
   */
  lineHeight?: PropertyLineHeight;
  /**
   * Default label-column width for every `PropertyItem` in this list (items can still override
   * it) — set the label gutter once for a whole form. Number → px, string → any CSS length, or a
   * per-breakpoint object.
   */
  labelWidth?: PropertyLabelWidth;
  /**
   * Default label placement for every `PropertyItem` in this list (items can still override it)
   * — e.g. force a whole list `horizontal`/`vertical` instead of the width-driven `auto`.
   */
  orientation?: PropertyOrientation;
  /**
   * Optional group heading rendered above the grid — useful to title a nested list
   * (e.g. an address broken down into its parts as a sub-group of the parent list).
   */
  label?: React.ReactNode;
  /**
   * Column span when this list is nested inside a multi-column `PropertyList`: a number
   * of columns, or `'full'` to span the whole row. Ignored at the top level or in a
   * single-column parent.
   */
  span?: number | 'full';
  /**
   * Centered, muted message shown when there are no items — e.g. "No properties".
   * When omitted, an empty list renders nothing.
   */
  emptyMessage?: React.ReactNode;
  /** `PropertyItem` children — or a nested `PropertyList` to group related fields. */
  children: React.ReactNode;
  /** Extra styles merged onto the outer container. */
  sx?: SxProps<Theme>;
};

// Translate a `span` into a CSS `grid-column` value (no-op outside a grid parent).
const spanToGridColumn = (span: number | 'full' | undefined): string | undefined => {
  if (span === 'full') {
    return '1 / -1';
  }
  return typeof span === 'number' ? `span ${span}` : undefined;
};

/**
 * A responsive grid of `PropertyItem`s — the shared layout behind both read
 * (label + value) and edit (label + input) panels. Items flow into `columns` equal
 * columns (collapsing to one on `xs`); each item decides label placement from its own
 * width, so the same list reads as inline rows in one wide column and as stacked cells
 * across several narrow columns. Purely presentational and Panel-agnostic.
 *
 * Lists nest: a `PropertyList` is itself a valid child of another `PropertyList`, so a
 * one-column list of summary fields can be followed by a two-column sub-list that breaks
 * one of them down (with an optional `label` heading, and `span` to stretch across a
 * multi-column parent).
 */
export const PropertyList = ({
  columns = 1,
  columnGap = 4,
  rowGap,
  density,
  lineHeight,
  labelWidth,
  orientation,
  label,
  span,
  emptyMessage,
  children,
  sx,
}: PropertyListProps) => {
  const inherited = useContext(PropertyListContext);
  // Resolve density from this list, then the parent's, then the compact default; `rowGap`
  // overrides it when set explicitly.
  const resolvedDensity = density ?? inherited.density ?? 'standard';
  const resolvedRowGap = rowGap ?? DENSITY_GRID_GAP[resolvedDensity];
  // Inherit a parent list's defaults unless this one sets its own (nested lists). Memoized on the
  // resolved values rather than rebuilt each render: this object is the context every `PropertyItem`
  // in the list consumes, so a fresh identity re-renders all of them (and each then rebuilds its own
  // layout `sx`) whenever an ancestor re-renders for an unrelated reason.
  const inheritedLineHeight = inherited.lineHeight;
  const inheritedLabelWidth = inherited.labelWidth;
  const inheritedOrientation = inherited.orientation;
  const contextValue: PropertyListContextValue = useMemo(
    () => ({
      lineHeight: lineHeight ?? inheritedLineHeight,
      labelWidth: labelWidth ?? inheritedLabelWidth,
      orientation: orientation ?? inheritedOrientation,
      density: resolvedDensity,
    }),
    [
      lineHeight,
      inheritedLineHeight,
      labelWidth,
      inheritedLabelWidth,
      orientation,
      inheritedOrientation,
      resolvedDensity,
    ]
  );
  const isEmpty = React.Children.toArray(children).length === 0;
  const gridColumn = spanToGridColumn(span);

  if (isEmpty && emptyMessage) {
    return (
      <Typography
        variant={'body2'}
        sx={{gridColumn, color: 'text.secondary', textAlign: 'center', py: 2, ...sx}}
      >
        {emptyMessage}
      </Typography>
    );
  }

  const grid = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))`},
        columnGap,
        rowGap: resolvedRowGap,
        // When there's a heading the span/sx live on the wrapper instead.
        ...(label ? {} : {gridColumn, ...sx}),
      }}
    >
      {/* Provider adds no DOM node, so the items stay direct grid children. */}
      <PropertyListContext.Provider value={contextValue}>{children}</PropertyListContext.Provider>
    </Box>
  );

  if (!label) {
    return grid;
  }

  return (
    <Box sx={{gridColumn, display: 'flex', flexDirection: 'column', gap: 1.5, ...sx}}>
      <Typography variant={'subtitle2'} sx={{color: 'text.primary'}}>
        {label}
      </Typography>
      {grid}
    </Box>
  );
};
