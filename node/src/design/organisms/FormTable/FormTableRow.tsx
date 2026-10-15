import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {varAlpha} from '@design/theme/utils';
import {Box, IconButton, useTheme} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {PropertyItem} from '../../molecules/PropertyItem';
import {PropertyList} from '../../molecules/PropertyList';
import type {FormTableColumn} from './FormTable';
import {FORM_WIDTH_REFERENCE_CLASS} from './constants';

/** Class on a row's delete button — drives the idle/active opacity. */
const ROW_DELETE_CLASS = 'ft-row-delete';

// Below this width an inline column would be squeezed past what its own control needs — e.g. a
// checkbox + label overflowing its cell and butting into the next column with no gap. Same floor
// as the other minimum field widths in the library (`SchemaRangeInput`, `schemaWrappedFieldSx`);
// see `requiredInlineWidth`, which uses it to decide when a row falls back to the stacked layout.
const COLUMN_MIN_WIDTH = 150;

// Rough width of the row's own trailing delete `IconButton`, for the same `requiredInlineWidth`
// estimate — not pixel-exact, just enough to bias the estimate a little conservative.
const DELETE_BUTTON_WIDTH = 40;

// Matches the rendered box of any MUI-based input (`TextField`, `Select`, `Autocomplete`, a MUI X
// date picker, …) — i.e. virtually everything a React Admin input renders. Used to measure a row's
// actual control height; see `FormTableRow`.
const CONTROL_SELECTOR = '.MuiInputBase-root';

// Anything that acts on a click itself: a form control, a button (MUI renders `Checkbox`,
// `IconButton` and friends as a `MuiButtonBase-root`), a link. A click inside one of these is that
// control's business, never the row's — see `FormTableProps.onRowClick`.
const INTERACTIVE_SELECTOR =
  'input, textarea, select, a[href], [role="button"], [role="combobox"], ' +
  '.MuiButtonBase-root, .MuiInputBase-root';

// ...unless the control is inert. A disabled or read-only control does nothing with a click, so the
// row may claim it — which is what makes the whole surface of a row whose inputs are all disabled
// clickable instead of just its padding, and what keeps a read-only cell (a checklist row's own
// choice name, rendered as a read-only input) behaving the same whether or not the row is ticked.
const INERT_SELECTOR =
  '.Mui-disabled, .Mui-readOnly, [disabled], [readonly], [aria-disabled="true"]';

/** Whether the clicked element acts on the click itself, leaving nothing for the row to do. */
const controlClaimsClick = (target: EventTarget | null) => {
  const control = (target as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE_SELECTOR);
  return !!control && !control.matches(INERT_SELECTOR);
};

// A row is a neutral card. On hover / while focused it gets a soft primary tint, a 4px primary
// accent stripe on the left, and its delete button goes to full opacity. Rows are stacked with a
// small gap — no borders, no striping. `padding` (theme spacing units) is density-driven.
const rowSx =
  (padding: number, clickable: boolean, hideContent: boolean): SxProps<Theme> =>
  (theme) => {
    // The tint/stripe are stronger in dark mode so they read on the darker surface.
    const isDark = theme.palette.mode === 'dark';
    const bg = isDark ? 0.2 : 0.08;
    const stripe = isDark ? 0.4 : 0.3;
    return {
      display: 'flex',
      // Always top-align: a column's control commonly reserves invisible space beneath itself for
      // a helper/error line (React Admin inputs do this by default), so centring the row against a
      // cell's full height — control + reserve — would centre the delete button against that too
      // and visibly push it below the control. The inline delete button instead measures the row's
      // actual control height itself (see `FormTableRow`) and centres against that; the stacked
      // layout leaves it top-aligned against the whole property list, which is the sensible anchor
      // for a "delete this whole row" action beside several stacked fields.
      alignItems: 'flex-start',
      gap: theme.spacing(2),
      p: padding,
      borderRadius: 1,
      backgroundColor: theme.palette.background.neutral,
      transition: theme.transitions.create(['background-color', 'box-shadow']),
      [`& .${ROW_DELETE_CLASS}`]: {
        color: theme.palette.error.main,
        opacity: 0.5,
        transition: theme.transitions.create('opacity'),
      },
      ...(clickable && {
        cursor: 'pointer',
        // A disabled control dispatches no click event at all — browsers drop it rather than let it
        // bubble — which would leave a dead patch in the middle of a row meant to be clickable,
        // exactly where a checklist row's inputs sit while it is unticked. Letting the pointer
        // through hands those clicks to the row instead. Read-only controls need no such help: they
        // dispatch normally, and `controlClaimsClick` is what lets those through.
        '& .Mui-disabled': {pointerEvents: 'none'},
      }),
      '&:hover, &:focus-within': {
        backgroundColor: varAlpha(theme.palette.primary.mainChannel, bg),
        // Inset shadow (not a border) so the accent stripe adds no layout shift.
        boxShadow: `inset 4px 0 0 0 ${varAlpha(theme.palette.primary.mainChannel, stripe)}`,
        [`& .${ROW_DELETE_CLASS}`]: {opacity: 1},
      },
      // The row keeps its own box — that box is what gets measured — and hides only what is inside
      // it. `visibility` rather than `display`, so the cells still have boxes of their own for the
      // same measurement to read their height from, and so they are out of the tab order and off the
      // accessibility tree while invisible. See `unmeasured` in `FormTableRow`.
      ...(hideContent && {'& > *': {visibility: 'hidden'}}),
    };
  };

export type FormTableRowProps<T> = {
  row: T;
  index: number;
  columns: FormTableColumn<T>[];
  inline: boolean;
  disabled: boolean;
  padding: number;
  /**
   * Whether this row offers its delete action. `false` keeps the action's track and renders the
   * button inert and invisible, so the row's columns stay aligned with the removable ones — see
   * `FormTableProps.canRemoveRow`.
   */
  removable: boolean;
  removeRowLabel: string;
  onRemove: (index: number) => void;
  /**
   * Called when the user clicks the row's own surface. `undefined` leaves the row inert — the
   * caller drops it for a row `canClickRow` rejects. See `FormTableProps.onRowClick`.
   */
  onRowClick?: (row: T, index: number) => void;
};

/**
 * One row card. Measures its own tallest rendered control (any `CONTROL_SELECTOR` match) so the
 * inline delete button — and any column with `align: 'center'` — can centre against that instead of
 * a naive full-cell centring, which a control's own invisible helper/error reserve would throw off
 * (see `rowSx`). Re-measures when the row's content can actually have changed — a render caused by
 * new `row`/`columns`/`index` props (a cell can swap which control it renders) — and observes the
 * row for layout changes a render doesn't cause (multiline auto-grow, a validation error appearing,
 * font load, zoom, …). Not after *every* render: `measure()` forces a synchronous layout
 * (`getBoundingClientRect` per control), and its own `setState` commits a second render — an
 * unconditional layout effect therefore measured twice per real change and once per row per
 * unrelated commit, which on a long list added up to a serial reflow storm. A second observer, on the
 * form shell rather than the row, covers what a row with no layout box of its own cannot see; and
 * with no measurement at all the row holds its box and hides its content rather than guess — see
 * `unmeasured`. `undefined` (no MUI control found — fully custom cell content) falls back to no
 * constraint, i.e. top-aligned like the stacked layout.
 *
 * The same observer also measures the row's own width: `inline={true}` renders inline only while
 * the row is wide enough to give every column its `COLUMN_MIN_WIDTH` floor (see
 * `requiredInlineWidth`) — narrower than that (a narrow dialog, a phone) it falls back to stacking
 * the same cells vertically instead, rather than squeezing columns past what their own control
 * needs (a checkbox + label overflowing its cell and butting into the next column with no gap).
 * That auto fallback (`autoStacked`) keeps each cell's own label — it is still the same inline
 * cell, just stacked — unlike an explicit `inline={false}`, which is a deliberate choice of the
 * labelled-property-row presentation for cells with no label of their own; a row never turns an
 * explicit `inline={false}` back into either of the other two.
 *
 * Wrapped in `React.memo` below: a form with several array lists otherwise re-rendered every row
 * of every list on any unrelated change elsewhere in the form. That only actually bails a render
 * when every prop is stable — in particular `columns` (memoized by the caller) and `onRemove`
 * (`FormTable`'s own `removeAt`, `useCallback`'d for the same reason) — a fresh reference on either
 * one defeats this for every row regardless.
 */
const FormTableRowComponent = <T,>({
  row,
  index,
  columns,
  inline,
  disabled,
  padding,
  removable,
  removeRowLabel,
  onRemove,
  onRowClick,
}: FormTableRowProps<T>) => {
  const theme = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);
  const [controlHeight, setControlHeight] = useState<number>();
  const [rowWidth, setRowWidth] = useState<number>();

  const measure = useCallback(() => {
    const node = rowRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    // No layout box at all — the row sits inside a `display: none` ancestor, which is how an inactive
    // tab panel / wizard step mounts (every panel up front, so their inputs stay registered). Keep
    // what was last measured: it is what lets that tab come back with its layout already right
    // instead of a blank frame, and the width of a form does not change just because a tab was
    // switched. When it does change, the second observer below is what notices.
    if (rect.width === 0) return;
    setRowWidth((prev) => (prev === rect.width ? prev : rect.width));
    const controls = node.querySelectorAll<HTMLElement>(CONTROL_SELECTOR);
    const tallest =
      controls.length === 0
        ? undefined
        : Math.max(...Array.from(controls, (el) => el.getBoundingClientRect().height));
    setControlHeight((prev) => (prev === tallest ? prev : tallest));
  }, []);

  // Deps, not after-every-render: with `React.memo` above, a render of this row means one of these
  // actually changed (or `measure`'s own setState landed, which must not re-trigger a measurement).
  // The ResizeObserver below covers everything a render doesn't cause.
  useLayoutEffect(() => {
    if (inline) measure();
  }, [inline, measure, row, columns, index]);

  useLayoutEffect(() => {
    if (!inline || !rowRef.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [inline, measure]);

  // The observer above goes silent exactly when the row needs it most: inside a `display: none`
  // ancestor the row has no box, so a window resize while it waits on a hidden tab changes nothing
  // it can see — and on the way back nothing re-renders it (its props don't change and `React.memo`
  // below bails), so the width it kept would lay real inputs out by a number that stopped being
  // true. The form container keeps its box throughout, so a second observer on it catches that
  // resize; finding the row still boxless when it fires is what says the kept width is now
  // meaningless. Dropped rather than re-measured, because there is nothing to measure yet — the row
  // then hides its content until there is (see `unmeasured`). Without such a container above it (a
  // standalone `FormTable`, a dialog) a row keeps its width, which is the best it can do.
  useLayoutEffect(() => {
    if (!inline) return;
    const reference = rowRef.current?.closest(`.${FORM_WIDTH_REFERENCE_CLASS}`);
    if (!reference) return;
    const observer = new ResizeObserver(() => {
      if (rowRef.current?.getBoundingClientRect().width !== 0) return;
      setRowWidth(undefined);
      setControlHeight(undefined);
    });
    observer.observe(reference);
    return () => observer.disconnect();
  }, [inline]);

  // Rough space every column needs side by side, plus the trailing delete button — not
  // pixel-exact (the row's real `gap` and the delete button's real width are close enough to these
  // estimates), just enough to decide whether this row still fits inline. `rowWidth === undefined`
  // (no measurement right now) assumes it fits, which is the arrangement the row is laid out in
  // while its content stays hidden — see `unmeasured`.
  const gapPx = parseFloat(theme.spacing(2));
  const requiredInlineWidth = columns.length * (COLUMN_MIN_WIDTH + gapPx) + DELETE_BUTTON_WIDTH;
  const effectiveInline = inline && (rowWidth === undefined || rowWidth >= requiredInlineWidth);
  // An `inline` row picks between two layouts from its own measured width, so with no measurement
  // there is nothing honest to paint: it holds its box and hides its content (see `rowSx`) until it
  // knows. Two ways in, both inside a `display: none` ancestor — the row has never been measured (it
  // mounted on an inactive tab), or the form was resized while it waited there and the second
  // observer above dropped a width that had stopped being true. Either way nothing re-renders the row
  // when that panel is revealed, so the only thing that can measure it again is an observer, after
  // the panel has painted. That is the frame this costs: an empty row card, instead of real inputs in
  // an arrangement about to change under them. Neither a row that mounts visible (measured in the
  // layout effect above, before the first paint) nor one coming back to a form that has not changed
  // width ever shows it. `inline={false}` never measures at all, and so is never unmeasured — it has
  // no width-dependent layout to wait for.
  const unmeasured = inline && rowWidth === undefined;
  // A row that falls back on its own (the caller asked for `inline` but there isn't room) just
  // stacks the same inline cells vertically — each keeps its own control's built-in label, exactly
  // as it would inline, so nothing doubles up. An explicit `inline={false}` is a deliberate choice
  // of the labelled-property-row presentation instead (see the render below), for cells — a bare
  // checkbox, say — that have no label of their own to begin with.
  const autoStacked = inline && !effectiveInline;

  // Extracted out of the JSX (rather than a nested ternary) per `sonarjs/no-nested-conditional` —
  // three mutually exclusive row layouts: side-by-side, auto-fallen-back-to-stacked (see
  // `autoStacked` above), or the explicit `inline={false}` labelled-property-row presentation.
  let cells: React.ReactNode;
  if (effectiveInline) {
    cells = columns.map((column) => (
      <Box
        key={column.key}
        sx={{
          flex: column.flex ?? 1,
          minWidth: 0,
          // Same treatment as the row's own delete button below: center against the row's real
          // control height instead of top-aligning, for a cell that has no invisible helper/error
          // reserve of its own (see the `align` doc on `FormTableColumn`). Sharing `controlHeight`
          // this way — rather than centering against the row's full flexbox height — means the
          // helper/error text of whichever cell actually owns it stays exactly where it always
          // was, "pushed" below the shared center line instead of pulling every other cell down
          // with it.
          //
          // A **column** flex box, not a row one: its children then stretch across the cell the way
          // they do in a plain block cell, so a `fullWidth` input still fills its column. Centering
          // a row flex box instead left every child at its shrink-to-fit width — a visibly short
          // input floating in a wide column. A child that must keep its natural width (a checkbox,
          // an icon) wraps itself in a box that takes the width for it.
          ...(column.align === 'center' && {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: controlHeight,
          }),
        }}
      >
        {column.render(row, index, {stacked: false})}
      </Box>
    ));
  } else if (autoStacked) {
    cells = (
      <Box sx={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2}}>
        {columns.map((column) => (
          <Box key={column.key}>{column.render(row, index, {stacked: false})}</Box>
        ))}
      </Box>
    );
  } else {
    cells = (
      <Box sx={{flex: 1, minWidth: 0}}>
        {/* Stacked: each column is a labelled property row; `smallInput` aligns the
            horizontal labels to the size-`small` inputs the array cells use. */}
        <PropertyList columns={1} lineHeight={'smallInput'}>
          {columns.map((column) => (
            <PropertyItem key={column.key} label={column.label}>
              {column.render(row, index, {stacked: true})}
            </PropertyItem>
          ))}
        </PropertyList>
      </Box>
    );
  }

  // A pointer shortcut and nothing more: `onRowClick` duplicates something the row already offers
  // through a real control, so the row itself stays out of the tab order. Giving it a `tabIndex`
  // would put a second stop in front of every row without offering a keyboard user anything the
  // control does not already give them, and a `role="button"` wrapped around real inputs is not
  // valid either.
  const clickable = !!onRowClick && !disabled;

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onRowClick) return;
    // A React event bubbles along the *React* tree, not the DOM one, so a click inside a portal a
    // cell opened — a `Select` menu, an autocomplete dropdown, a date picker, a dialog — arrives
    // here even though it landed nowhere near the row. Containment in the real DOM is what tells
    // the two apart; everything the guard below reasons about is inside the row card.
    if (!rowRef.current?.contains(event.target as Node)) return;
    if (controlClaimsClick(event.target)) return;
    // The click that ends a drag-selection of text is not a click on the row.
    if (document.getSelection()?.isCollapsed === false) return;
    onRowClick(row, index);
  };

  return (
    <Box
      ref={rowRef}
      sx={rowSx(padding, clickable, unmeasured)}
      onClick={clickable ? handleRowClick : undefined}
    >
      {cells}
      <Box
        sx={{
          flex: '0 0 auto',
          // Inline only: centre the button within a box the height of the row's actual control, so
          // it ignores whatever helper/error space that control reserves below it. The stacked
          // layout (explicit or auto-fallen-back-to, see `effectiveInline`) leaves this plain — it
          // stays top-aligned against the row (see `rowSx` above).
          ...(effectiveInline && {display: 'flex', alignItems: 'center', minHeight: controlHeight}),
        }}
      >
        <IconButton
          className={ROW_DELETE_CLASS}
          size={'small'}
          aria-label={removeRowLabel}
          disabled={disabled || !removable}
          onClick={() => onRemove(index)}
          // Hidden rather than unmounted: the button keeps its space, so a non-removable row's
          // columns stay in the same track as every other row's. `visibility: hidden` also takes it
          // out of the tab order and off the accessibility tree, so it is not merely invisible.
          sx={!removable ? {visibility: 'hidden'} : undefined}
        >
          <Icon icon={IconType.Delete} size={20} />
        </IconButton>
      </Box>
    </Box>
  );
};

// `React.memo` erases the generic parameter (it types the wrapped component as `unknown`-generic),
// so the result is cast back to the original generic signature — the standard pattern for
// memoizing a generic component in TS.
export const FormTableRow = React.memo(FormTableRowComponent) as typeof FormTableRowComponent;
