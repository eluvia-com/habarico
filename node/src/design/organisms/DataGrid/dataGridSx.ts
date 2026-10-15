import type {CSSObject, Theme} from '@mui/material';
import {DENSITY_TABLE_PADDING_Y} from '../../constants';
import {pinnedColumnShadowSx, rowActionsGroupSx} from '../../utils/tableActions';
import {ACTIONS_FIELD, ROW_ACTIONS_CLASS, SPACER_FIELD} from './constants';
import {actionsHighlightSx, rowHighlightResetSx, rowHighlightSx} from './highlight';
import {stripedActionsSx, stripedRowSx} from './striping';
import {rowTintSx} from './tinting';

// A data cell — i.e. not the checkbox-selection or actions cell (both hold a taller icon button
// that shouldn't take the row's vertical padding, which would inflate the row height).
const DATA_CELL = `.MuiDataGrid-cell:not(.MuiDataGrid-cellCheckbox):not([data-field="${ACTIONS_FIELD}"])`;

/**
 * The restyle applied to the MUI X DataGrid so it matches the redesign: a neutral header band
 * with column dividers, divider row borders, hover/selected row tints, per-row semantic tinting,
 * and a right-pinned actions column (CSS-sticky — column pinning is Pro-only) whose buttons fade
 * to 30% until the row is hovered/selected. Theme-token driven; merge with the consumer's `sx`.
 *
 * This is the **assembler**: the grid chrome lives here, while the row-state visuals are composed
 * from feature modules (`tinting` / `highlight` / `striping`) and the actions look from the shared
 * `tableActions`. The spread order matters — striping is emitted before the hover/selected highlight
 * so those equal-specificity rules win on interaction.
 *
 * Pass `rowHighlight: false` to drop the hover/selected row highlight — used by grids that rely on
 * per-row semantic tinting, where the highlight would clash with the row colors.
 */
export const dataGridSx = (
  theme: Theme,
  {rowHighlight = true, stripedRows = false}: {rowHighlight?: boolean; stripedRows?: boolean} = {}
): CSSObject => ({
  border: 'none',
  // The grid's root-level custom properties, redefined under `&.MuiDataGrid-root` (two classes) so
  // they out-specify MUI X's own definitions regardless of cascade order — both its injected
  // `<style>` tag (the v9 `-t-` surface tokens) and its styled root (`--DataGrid-rowBorderColor`). A
  // plain `--var` in `sx` (one class, emitted earlier) loses to the injected `<style>`.
  // Base transparent → the grid (footer + any uncovered area) blends into its surface (a paper
  // `Panel`, the default layout, …); the header keeps its neutral band and the pinned actions column
  // stays opaque.
  '&.MuiDataGrid-root': {
    '--DataGrid-rowBorderColor': theme.palette.divider,
    '--DataGrid-t-color-background-base': 'transparent',
    '--DataGrid-t-header-background-base': theme.palette.background.default,
    '--DataGrid-t-cell-background-pinned': theme.palette.background.paper,
  },

  // Footer (pagination) sits flush — no top divider, transparent so it blends into the surface.
  '& .MuiDataGrid-footerContainer': {
    borderTop: 'none',
    backgroundColor: 'transparent',
  },
  // Drop the global TablePagination margins (meant for a scrollbar gutter) so the pagination
  // centers vertically in the footer instead of sitting a few px high.
  '& .MuiDataGrid-footerContainer .MuiTablePagination-root': {
    margin: 0,
  },

  // Header band — set on the cells too: the container var alone leaves the header cells
  // paper-white in this theme. The fillers cover the empty space when the columns don't fill
  // the width (and the scrollbar gutter), so tint them to match the band.
  '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaders .MuiDataGrid-filler, & .MuiDataGrid-columnHeaders .MuiDataGrid-scrollbarFiller':
    {
      backgroundColor: theme.palette.background.default,
    },
  // Drop MUI X's bottom border on the header row (its `row--borderBottom` rule on the top container).
  // The design has no divider under the header band; the `&`-prefixed triple-class selector
  // out-specifies MUI X's own two-class rule regardless of cascade order.
  '& .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader, & .MuiDataGrid-row--borderBottom .MuiDataGrid-filler, & .MuiDataGrid-row--borderBottom .MuiDataGrid-scrollbarFiller':
    {
      borderBottom: 'none',
    },
  '& .MuiDataGrid-columnHeaderTitle': {
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightSemiBold,
  },
  // The actively-sorted column's title is emphasised.
  '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-columnHeaderTitle': {
    color: theme.palette.text.primary,
  },

  // MUI X hides the resize handles on either side of a focused/sorted/filtered column (it makes
  // room for a border we don't draw). Clicking to sort focuses the column, so its handles — and the
  // sibling's — vanish; keep them visible. The doubled separator class out-specifies MUI X's rule.
  ['& .MuiDataGrid-columnHeader:focus .MuiDataGrid-columnSeparator.MuiDataGrid-columnSeparator, ' +
  '& .MuiDataGrid-columnHeader--siblingFocused .MuiDataGrid-columnSeparator.MuiDataGrid-columnSeparator, ' +
  '& .MuiDataGrid-columnHeader--withLeftBorder .MuiDataGrid-columnSeparator.MuiDataGrid-columnSeparator, ' +
  '& .MuiDataGrid-columnHeader--withRightBorder .MuiDataGrid-columnSeparator.MuiDataGrid-columnSeparator']:
    {opacity: 1},

  // The sort button is a plain caret — drop its padding and background so it reads as just the
  // icon on the header band. The doubled class out-specifies MUI X's own
  // `.MuiDataGrid-columnHeader .MuiDataGrid-sortButton` rule (which paints it the header base color).
  '& .MuiDataGrid-columnHeader .MuiDataGrid-sortButton.MuiDataGrid-sortButton': {
    padding: 0,
    backgroundColor: 'transparent',
    '&:hover': {backgroundColor: 'transparent'},
  },

  // Column resize handles only (no cell dividers). Keep MUI X's full-width separator as the mouse
  // grab area but hide its glyph (`opacity:0`, box kept so the ~10px separator stays grabbable) and
  // draw a short 2×12px bar as a centered overlay — divider by default, primary on hover (via
  // `currentColor`).
  '& .MuiDataGrid-iconSeparator': {opacity: 0},
  '& .MuiDataGrid-columnSeparator': {
    color: theme.palette.divider,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 2,
      height: 12,
      borderRadius: 1,
      backgroundColor: 'currentColor',
      pointerEvents: 'none',
    },
  },
  '& .MuiDataGrid-columnSeparator--resizable:hover': {color: theme.palette.primary.main},

  // Drop the cell/header click-focus outline — selection already highlights the row.
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
    {outline: 'none'},

  // Center cell content vertically so single-line cells (and the actions) stay centered when a
  // sibling cell wraps to multiple lines (auto row height).
  '& .MuiDataGrid-cell': {display: 'flex', alignItems: 'center'},

  // With auto row height MUI X's density factor no longer drives the row height (it's content-
  // driven), so density instead scales the cell's vertical padding — the row grows from padding +
  // however many lines the content has, independent of the line count. Only DATA cells get the
  // padding: the checkbox and actions cells hold a taller icon button, so padding them would inflate
  // the row height; they just center within whatever the data cells set.
  // `paddingBlock` (= `py` in spacing units, resolved here to px via `theme.spacing`, since
  // `CSSObject` has no `py` system shorthand).
  [`&.MuiDataGrid-root--densityCompact ${DATA_CELL}`]: {
    paddingBlock: theme.spacing(DENSITY_TABLE_PADDING_Y.compact),
  },
  [`&.MuiDataGrid-root--densityStandard ${DATA_CELL}`]: {
    paddingBlock: theme.spacing(DENSITY_TABLE_PADDING_Y.standard),
  },
  [`&.MuiDataGrid-root--densityComfortable ${DATA_CELL}`]: {
    paddingBlock: theme.spacing(DENSITY_TABLE_PADDING_Y.comfortable),
  },

  // The selection checkbox (header + per-row) is excluded from the density padding above so it can't
  // drive the row height. Two things fall out of the checkbox box size: MUI's default 9px padding
  // makes it ~38px — taller than a compact row (content-driven with auto height) — and MUI X keeps it
  // centered in its fixed 50px column, so the box size also sets the left/right inset. A 3px pad → a
  // 26px box: short enough to fit the smallest density row, and centered it leaves a 12px inset each
  // side (the icon itself is unchanged; only the click-target padding shrinks).
  '& .MuiDataGrid-cellCheckbox .MuiCheckbox-root, & .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root':
    {
      padding: '3px',
    },

  // Rows: paper by default; the hover/selected highlight (primary tint + left accent stripe) is
  // added by `rowHighlightSx`, or MUI X's built-in hover/selected backgrounds are reset when
  // disabled. Striping is spread before the highlight so the highlight wins on interaction.
  '& .MuiDataGrid-row': {backgroundColor: theme.palette.background.paper},
  ...(stripedRows ? stripedRowSx(theme) : {}),
  ...(rowHighlight ? rowHighlightSx(theme) : rowHighlightResetSx(theme)),

  ...rowTintSx(theme),

  // Row actions: idle at 30%, full opacity once the row is hovered or selected (shared with DataTable).
  ...rowActionsGroupSx(
    ROW_ACTIONS_CLASS,
    ['.MuiDataGrid-row:hover', '.MuiDataGrid-row.Mui-selected'],
    theme
  ),

  // Right-pinned actions column (CSS sticky, not the Pro column-pinning feature). Its z-index sits
  // above the column resize handles (which MUI X gives z-index 30) so a column scrolling under the
  // pinned column doesn't poke its separator through.
  [`& .MuiDataGrid-cell[data-field="${ACTIONS_FIELD}"], & .MuiDataGrid-columnHeader[data-field="${ACTIONS_FIELD}"]`]:
    {
      position: 'sticky',
      right: 0,
      zIndex: 31,
      // A left-clipped shadow separates the pinned column when the grid scrolls horizontally.
      ...pinnedColumnShadowSx(theme),
    },
  // Body actions cell needs an OPAQUE background — as a sticky column it overlaps the cells that
  // scroll under it, and the row's hover/selected tints are semi-transparent (they'd let that
  // content bleed through). So paint an opaque paper base and overlay the row's tint as a gradient
  // layer, keeping the same look while staying opaque. Header actions cell keeps the header band.
  [`& .MuiDataGrid-cell[data-field="${ACTIONS_FIELD}"]`]: {
    backgroundColor: theme.palette.background.paper,
  },
  ...(stripedRows ? stripedActionsSx(theme) : {}),
  ...(rowHighlight ? actionsHighlightSx(theme) : {}),
  [`& .MuiDataGrid-columnHeader[data-field="${ACTIONS_FIELD}"]`]: {
    backgroundColor: theme.palette.background.default,
  },

  // The flexible spacer column is empty plumbing — it carries no title and no resize handle, so
  // drop its column separator (a divider between the last data column and the pinned actions would
  // otherwise float in the middle of the row's empty right gutter).
  [`& .MuiDataGrid-columnHeader[data-field="${SPACER_FIELD}"] .MuiDataGrid-columnSeparator`]: {
    display: 'none',
  },
});
