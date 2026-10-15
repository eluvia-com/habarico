import React, {useContext, useMemo} from 'react';
import {Box, SxProps, Theme, Tooltip, Typography} from '@mui/material';
import type {SystemStyleObject} from '@mui/system';
import {Icon, IconType} from '../../atoms/Icon';
import {PropertyListContext} from '../PropertyList/PropertyListContext';

// Below this item width a PropertyItem stacks its label above the value; at or above
// it the label sits beside the value. Tuned so a two-column property grid inside a
// half-width panel stacks (narrow cells), while a single wide column stays inline.
const HORIZONTAL_AT = 320;

// Marker classes so the responsive container query (declared on the item root) can
// retarget the label/value cells without threading state through both children.
const LABEL_CLASS = 'PropertyItem-label';
const VALUE_CLASS = 'PropertyItem-value';

/**
 * Label placement of a {@link PropertyItem}:
 *  - `auto` — driven by the item's own width via a CSS container query: label above
 *    the value when narrow, beside it when wide. This is what makes a 2-column grid
 *    stack while a single wide column stays inline, with no per-item configuration.
 *  - `horizontal` — always label beside value.
 *  - `vertical` — always label above value.
 */
export type PropertyOrientation = 'auto' | 'horizontal' | 'vertical';

/**
 * Per-breakpoint override of the label column width — lets a cell that is intentionally wider
 * than its siblings (e.g. an explicit full-row `gridItem` span) scale its label back down so the
 * label/value boundary still lines up with the narrower cells beside it, instead of the default
 * `%`-of-own-width growing along with the wider cell.
 */
export type PropertyLabelWidthBreakpoints = Partial<
  Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number | string>
>;

/** Label column width: a single value, or a per-breakpoint override (see {@link PropertyLabelWidthBreakpoints}). */
export type PropertyLabelWidth = number | string | PropertyLabelWidthBreakpoints;

/**
 * Row height reserved in the `horizontal` layout so the label lines up with the control beside
 * it, and a value shorter than that control stays centered against it. The presets come in a
 * `Field` (read) and an `Input` (edit) family: `smallField` / `mediumField` for a row that renders
 * a value, `smallInput` / `mediumInput` for one that renders a control. A number is px and a
 * string is any CSS length. Applied only in the horizontal layout — never when stacked.
 */
export type PropertyLineHeight =
  'smallField' | 'mediumField' | 'smallInput' | 'mediumInput' | number | string;

// Heights (px) a row reserves, in the library's own field/input vocabulary.
//
// `smallInput` / `mediumInput` are the theme's outlined inputs (MUI defaults — no theme override),
// so a horizontal label can be centered against the input beside it without measuring it.
//
// The `Field` pair is the read counterpart: a detail row renders a value, not a control, and those
// differ in height by type — 22px for a `body2` text value, 24px for a chip, and ~26px once the
// chip's inline-block wrapper adds its line box's leading on top. `smallField` clears all of them
// at the tightest height that still gives a detail panel one row rhythm and centers a chip that
// would otherwise sit low, off its label's center. It is also what the theme anchors a `small`
// button and MUI's `small` `IconButton` on, so an action rendered in such a row sits inside it
// instead of growing it. `mediumField` matches `smallInput`, for a read panel that has to line up
// row-for-row with the edit form it toggles into.
const LINE_HEIGHT_PRESETS: Record<
  'smallField' | 'mediumField' | 'smallInput' | 'mediumInput',
  number
> = {
  smallField: 28,
  mediumField: 40,
  smallInput: 40,
  mediumInput: 56,
};

const resolveLineHeight = (lineHeight: PropertyLineHeight): number | string =>
  typeof lineHeight === 'string' && lineHeight in LINE_HEIGHT_PRESETS
    ? LINE_HEIGHT_PRESETS[lineHeight as keyof typeof LINE_HEIGHT_PRESETS]
    : lineHeight;

export type PropertyItemProps = {
  /** Field label (the caption shown for the value/input). */
  label: React.ReactNode;
  /** Optional help — a help icon after the label with this text in a tooltip. */
  help?: React.ReactNode;
  /**
   * Label placement. Defaults to `auto` (width-driven). Inherited from the enclosing
   * `PropertyList` when omitted.
   */
  orientation?: PropertyOrientation;
  /**
   * Width of the label column in `horizontal` layout. Number → px, string → any CSS
   * length (e.g. `'40%'`), or a per-breakpoint object to override it only at some
   * breakpoints. Defaults to `'40%'`. Inherited from the enclosing `PropertyList` when omitted.
   */
  labelWidth?: PropertyLabelWidth;
  /**
   * Height both cells reserve in the `horizontal` layout, so the label lines up (centered) with
   * the control beside it — regardless of any helper text / error below the input — and a value
   * shorter than that control (e.g. a read-only field in an edit form) is centered against the
   * label instead of sitting at the top of the row. Pick the preset that matches what the row
   * renders — `smallField` / `mediumField` for a value, `smallInput` / `mediumInput` for a
   * control; a number is px, a string is any CSS length. Ignored in the `vertical` (stacked)
   * layout. Inherited from the enclosing `PropertyList` when omitted; set it there once for a
   * whole list.
   */
  lineHeight?: PropertyLineHeight;
  /**
   * Column span inside a multi-column `PropertyList`: a number of columns, or `'full'`
   * to span the whole row. Ignored in a single-column list.
   */
  span?: number | 'full';
  /**
   * The value (read) or input (edit) for this field. A plain string/number is wrapped
   * in the standard value typography; any node is rendered as-is (e.g. an `OutlinedInput`,
   * `Autocomplete`, `Link` or custom markup).
   */
  children: React.ReactNode;
  /** Extra styles merged onto the item root. */
  sx?: SxProps<Theme>;
};

// Vertical (label above value) — the narrow / default layout.
const verticalSx: SystemStyleObject<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.25,
};

const toBasis = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : value;

const isResponsiveLabelWidth = (
  labelWidth: PropertyLabelWidth
): labelWidth is PropertyLabelWidthBreakpoints => typeof labelWidth === 'object';

// Horizontal (label beside value) — the wide layout. Retargets the label/value cells via
// their marker classes so it can be applied either directly or inside a container query. The
// row is top-aligned so helper text / errors below an input don't shift the label. When a
// `lineHeight` is given, both cells take that height (= the input's height) and center their
// content in it, so the label lines up with the input's centre without measuring it. The value
// cell needs it too: a slot shorter than an input — a read-only value among editable fields —
// would otherwise sit at the top of the row while the label stays centered. It centers with
// `alignContent` rather than by becoming a flex box, so the slot keeps block layout and its
// content keeps its own width (a full-width input still fills the cell, a button stays its own
// size). Content taller than `lineHeight` has no free space to distribute and is unaffected.
const horizontalSx = (
  labelWidth: PropertyLabelWidth,
  lineHeight?: number | string
): SystemStyleObject<Theme> => {
  // A plain string/number applies at every breakpoint; a breakpoint object is passed through
  // as-is so MUI's `sx` prop turns each key into its own media query (its built-in responsive
  // object support, same as for e.g. `sx={{width: {xs: ..., md: ...}}}`).
  const flex = isResponsiveLabelWidth(labelWidth)
    ? Object.fromEntries(
        Object.entries(labelWidth).map(([breakpoint, value]) => [
          breakpoint,
          `0 0 ${toBasis(value)}`,
        ])
      )
    : `0 0 ${toBasis(labelWidth)}`;
  // The label box centers its own content (it is a flex row), the value cell does it with
  // `alignContent`.
  const labelHeightSx = lineHeight != null ? {minHeight: lineHeight} : {};
  const valueHeightSx = lineHeight != null ? {minHeight: lineHeight, alignContent: 'center'} : {};
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    [`& > .${LABEL_CLASS}`]: {
      flex,
      ...labelHeightSx,
    },
    [`& > .${VALUE_CLASS}`]: {flex: 1, minWidth: 0, ...valueHeightSx},
  };
};

// Static `sx` objects for the parts that never vary with props. Module-level so each item reuses
// one frozen reference instead of allocating five fresh objects on every render.
const labelCellSx: SystemStyleObject<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  minWidth: 0,
};
const valueCellSx: SystemStyleObject<Theme> = {minWidth: 0};
const labelTextSx: SystemStyleObject<Theme> = {color: 'text.secondary'};
const valueTextSx: SystemStyleObject<Theme> = {color: 'text.primary', wordBreak: 'break-word'};
const helpIconSx: SystemStyleObject<Theme> = {
  display: 'inline-flex',
  cursor: 'help',
  color: 'text.disabled',
};

/**
 * A single label + value/input pair. The value slot is layout-agnostic: pass a
 * `<Typography>`/string for a read view or a bare input (`OutlinedInput`,
 * `Autocomplete`, …) for an edit view — the item lays out the label identically, so
 * one component drives both detail and form panels. Compose several inside a
 * `PropertyList`. Panel-agnostic: usable in a `Panel`, a `Dialog` or anywhere.
 */
// Translate a `span` into a CSS `grid-column` value (no-op outside a grid parent).
const spanToGridColumn = (span: number | 'full' | undefined): string | undefined => {
  if (span === 'full') {
    return '1 / -1';
  }
  return typeof span === 'number' ? `span ${span}` : undefined;
};

export const PropertyItem = ({
  label,
  help,
  orientation: orientationProp,
  labelWidth: labelWidthProp,
  lineHeight,
  span,
  children,
  sx,
}: PropertyItemProps) => {
  const {
    lineHeight: inheritedLineHeight,
    labelWidth: inheritedLabelWidth,
    orientation: inheritedOrientation,
  } = useContext(PropertyListContext);

  // Precedence for the list-uniform props: the item's own prop, then the value inherited from
  // its `PropertyList`, then the component default.
  const orientation = orientationProp ?? inheritedOrientation ?? 'auto';
  const labelWidth = labelWidthProp ?? inheritedLabelWidth ?? '40%';

  const value =
    typeof children === 'string' || typeof children === 'number' ? (
      <Typography variant={'body2'} sx={valueTextSx}>
        {children}
      </Typography>
    ) : (
      children
    );

  // The label-height alignment aid applies only in the horizontal layout; `vertical` never
  // uses it. An item's own `lineHeight` overrides the value inherited from its `PropertyList`.
  const effectiveLineHeight = lineHeight ?? inheritedLineHeight;
  const horizontalLineHeight =
    effectiveLineHeight != null && orientation !== 'vertical'
      ? resolveLineHeight(effectiveLineHeight)
      : undefined;

  // The layout `sx` is a nested object (the `auto` variant embeds a whole container-query block),
  // rebuilt from scratch on every render before this. Memoized on the three values it is derived
  // from so a re-render that changes none of them reuses the same object.
  const layoutSx: SystemStyleObject<Theme> = useMemo(() => {
    if (orientation === 'horizontal') {
      return horizontalSx(labelWidth, horizontalLineHeight);
    }
    if (orientation === 'vertical') {
      return verticalSx;
    }
    return {
      ...verticalSx,
      [`@container (min-width: ${HORIZONTAL_AT}px)`]: horizontalSx(
        labelWidth,
        horizontalLineHeight
      ),
    };
  }, [orientation, labelWidth, horizontalLineHeight]);

  // `auto` needs the item to be a size container so children can query its width.
  const rootSx: SxProps<Theme> = useMemo(
    () => ({
      gridColumn: spanToGridColumn(span),
      ...(orientation === 'auto' ? {containerType: 'inline-size'} : {}),
      ...sx,
    }),
    [span, orientation, sx]
  );

  return (
    <Box sx={rootSx}>
      <Box sx={layoutSx}>
        <Box className={LABEL_CLASS} sx={labelCellSx}>
          <Typography variant={'body2'} sx={labelTextSx}>
            {label}
          </Typography>
          {help && (
            <Tooltip title={help} arrow>
              <Box component={'span'} sx={helpIconSx}>
                <Icon icon={IconType.Help} width={16} />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Box className={VALUE_CLASS} sx={valueCellSx}>
          {value}
        </Box>
      </Box>
    </Box>
  );
};
