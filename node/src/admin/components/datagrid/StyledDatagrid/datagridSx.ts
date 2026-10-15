import {DENSITY_TABLE_PADDING_Y} from '@design/constants';
import {CSSObject, Theme} from '@mui/material';
import {actionsColumnSx} from './actions';
import {ACTIONS_COLUMN_CLASS, DND_COLUMN_CLASS, SPACER_COLUMN_CLASS} from './constants';
import {rowHighlightSx} from './highlight';

// Content cells = every header/body cell except the helper columns (row actions, drag handle,
// selection checkbox), whose taller controls must never drive the row height. Matches the exclusion
// used by AdminSettingsStyles' density overrides.
const CONTENT_CELL_FILTER = `:not(.${ACTIONS_COLUMN_CLASS}):not(.${DND_COLUMN_CLASS}):not(.MuiTableCell-paddingCheckbox)`;
const CONTENT_CELLS = `& th.MuiTableCell-root${CONTENT_CELL_FILTER}, & td.MuiTableCell-root${CONTENT_CELL_FILTER}`;

/**
 * The restyle applied to React Admin's `<Datagrid>` so it matches the redesign. This is the
 * **assembler**: it owns the grid chrome (cell ellipsis, spacer column, sort label, table border,
 * the neutral header band, the drag column) and the row's resting paper surface, then composes the
 * row-state visuals from feature modules — `rowHighlightSx` (hover/selected tint + accent stripe) and
 * `actionsColumnSx` (the sticky, shadowed actions column + its idle/hover button opacity). Mirrors the
 * module split of design/organisms/DataGrid's `dataGridSx`.
 */
export const datagridSx = (theme: Theme): CSSObject => ({
  // Baseline row/header rhythm = STANDARD density: a 24px line box (matching the MUI table-head
  // line-height) + 8px vertical padding → a 40px single-line row/header. This is the default look
  // whenever `AdminSettingsStyles` (the body-class density overrides) is NOT mounted; when it is,
  // compact/comfortable override just the padding per body class. Helper columns are excluded so
  // their taller controls never drive the height.
  [CONTENT_CELLS]: {
    lineHeight: '24px',
    paddingTop: `${8 * DENSITY_TABLE_PADDING_Y.standard}px`,
    paddingBottom: `${8 * DENSITY_TABLE_PADDING_Y.standard}px`,
  },

  '& th, & td div': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  [`& th.${SPACER_COLUMN_CLASS}, & td.${SPACER_COLUMN_CLASS}`]: {
    minWidth: 0,
    padding: 0,
  },

  '& th .MuiTableSortLabel-root': {
    // Anchor the overlaid sort caret (below).
    position: 'relative',
    minWidth: 0,
    maxWidth: '100%',

    '& .DatagridHeaderCell-title': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'inline-block',
    },
  },

  // The sort caret is overlaid past the title rather than laid out inline — for EVERY column, not
  // just the active one. The datagrid is a real, content-sized `<table>` (unlike the design grid's
  // fixed-width MUI X columns), so an inline caret grows the header cell: on the active column it
  // would shift the whole table when sorting is activated, and the opacity-0 hover caret on idle
  // sortable columns inflates the header row height above its density target. Absolute positioning
  // keeps the caret out of the cell's box, so the header height is driven only by the title line +
  // padding. Vertical centring uses auto margins, not a `transform` — MUI owns the caret's
  // `transform` for the ascending / descending rotation.
  '& th .MuiTableSortLabel-root .MuiTableSortLabel-icon': {
    position: 'absolute',
    left: '100%',
    top: 0,
    bottom: 0,
    margin: 'auto 0',
    pointerEvents: 'none',
  },

  // There should be a border between grid and pagination
  '& table.RaDatagrid-table': {
    // @ts-ignore
    borderBottom: `1px solid ${theme.palette.background.neutral}`,
  },

  // Table header should be grey
  '& th.RaDatagrid-headerCell': {
    // @ts-ignore
    backgroundColor: theme.palette.background.neutral,
    '&:first-of-type': {
      borderTopLeftRadius: 0,
    },
    '&:last-of-type': {
      borderTopRightRadius: 0,
    },

    '& .DatagridHeaderCell-action': {
      backgroundColor: theme.palette.background.neutral,
    },
  },

  // Drag and drop column should have a special padding to not take so much space
  [`& td.RaDatagrid-rowCell.${DND_COLUMN_CLASS}`]: {
    padding: 0,
    paddingLeft: theme.spacing(0.5),
  },

  // The bulk-selection checkbox (header select-all + per-row) sits in its own `padding="checkbox"`
  // column, which is excluded from the density padding so it can't drive the row height — but MUI's
  // checkbox is ~38px tall on its default 9px padding, taller than a compact (32px) row. Trim that
  // padding so the checkbox box fits under the smallest density row and the data cells keep driving
  // the height (the icon itself is unchanged; only the click-target padding shrinks).
  '& .MuiTableCell-paddingCheckbox .MuiCheckbox-root': {
    padding: '4px',
  },

  // MUI's `size="small"` checkbox cell defaults to `0 12px 0 16px` — trim the 16px left inset to 12px.
  '& td.MuiTableCell-paddingCheckbox, & th.MuiTableCell-paddingCheckbox': {
    paddingLeft: '12px',
  },

  // Rows paint an opaque paper surface — the sticky actions column scrolls over the data cells, so
  // the whole row must be opaque (this is also the resting surface the hover/selected tint layers
  // over). Kept in the assembler so both `rowHighlightSx` and `actionsColumnSx` compose on top.
  [`tr td.MuiTableCell-body, tr td.RaDatagrid-rowCell.${ACTIONS_COLUMN_CLASS}`]: {
    backgroundColor: theme.palette.background.paper,
  },

  ...actionsColumnSx(theme),
  ...rowHighlightSx(theme),
});
