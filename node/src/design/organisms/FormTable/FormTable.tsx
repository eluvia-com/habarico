import React, {useCallback} from 'react';
import {Box, Stack, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {IconType} from '../../atoms/Icon';
import {DENSITY_ROW_CARD_GAP, DENSITY_ROW_CARD_PADDING} from '../../constants';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {FormTableRow} from './FormTableRow';

export type FormTableDensity = 'compact' | 'standard' | 'comfortable';

export type FormTableColumn<T> = {
  /** Stable column id (also the React key of the cell). */
  key: string;
  /** Column width as a flex ratio. Defaults to `1`, so columns share the width equally. */
  flex?: number;
  /**
   * Field label. Only used in the explicitly stacked (`inline={false}`) layout, where each column
   * becomes a `PropertyItem` that owns the label beside its bare input — for a cell with no label
   * of its own (a bare checkbox, say). Ignored in the inline layout, and in the *automatic* narrow-
   * container fallback (see `render`'s `stacked` argument): both instead expect each cell input to
   * carry its own visible label, if it has one.
   */
  label?: React.ReactNode;
  /**
   * Renders the cell's input for a given row. The input binds its own value/onChange — `FormTable`
   * does not manage cell values. Return `null` to leave the cell empty; it still occupies its
   * track, so columns stay aligned across rows.
   *
   * `stacked` is true only when *this row* has become a `PropertyItem`-labelled property row — an
   * explicit `inline={false}` (see `label`). A caller whose input renders its own visible label
   * (most React Admin inputs) should suppress it exactly then — the `PropertyItem` already shows
   * `label` beside it, so leaving the input's own label on doubles it up. It stays `false` when an
   * inline `FormTable` merely falls back to stacking its cells vertically because a narrow
   * container (a small screen, a narrow dialog) can no longer fit them side by side (see
   * `FormTableRow`) — that fallback keeps each cell exactly as it renders inline, own label and
   * all, just arranged in a column instead of a row.
   */
  render: (row: T, rowIndex: number, info: {stacked: boolean}) => React.ReactNode;
  /**
   * Inline layout only. `'start'` (default) top-aligns the cell with the rest of the row — the
   * right choice for a normal input, since a React Admin input reserves invisible helper/error space
   * below itself and top-aligning avoids centering against that inflated height (see `FormTableRow`).
   * `'center'` instead centers the cell against the row's actual (non-reserved) control height, same
   * as the row's own delete button — use it for a cell that isn't itself a React Admin input and so
   * has no such reserve (a checkbox, an icon, a short label), which would otherwise sit pinned to the
   * top of the row instead of level with its siblings' real controls.
   *
   * Either way the cell's content still stretches across the column, so a `fullWidth` input fills it
   * — a `'center'` cell that must keep a child at its natural width (a checkbox, an icon) wraps that
   * child in a box of its own.
   */
  align?: 'start' | 'center';
};

export type FormTableProps<T> = {
  /** The rows — an array of row objects. The single source of truth for the row count. */
  value: T[];
  /**
   * Called with the next array when a row is **added, removed or all rows are cleared**. Cell edits
   * do NOT go through here — the inputs rendered by `columns[].render` bind their own values.
   */
  onChange: (next: T[]) => void;
  /** Column definitions, in display order. */
  columns: FormTableColumn<T>[];
  /** Factory for the object appended when the user clicks "Add". */
  createRow: () => T;
  /** Row key — defaults to the row index. */
  getRowKey?: (row: T, index: number) => React.Key;
  /**
   * Whether a given row offers its delete action. Defaults to every row being removable. A row that
   * answers `false` keeps the action's track — the button is rendered inert and invisible rather
   * than dropped — so the columns of a non-removable row still line up with those of its
   * neighbours. Use it where deleting a particular row is meaningless rather than merely forbidden
   * (`disabled` turns the whole table off): a checklist row that stands for a choice nobody has
   * ticked yet has nothing behind it to delete, and a visible button there would do nothing.
   */
  canRemoveRow?: (row: T, index: number) => boolean;
  /**
   * Called when the user clicks a row's own surface — its padding, the gaps between cells, and any
   * cell content that is not a live control. A click an input, a button or a link handles itself
   * never arrives here, so a row can be clickable without swallowing the clicks its own cells need;
   * a control that is disabled or read-only does nothing with a click, so the row claims that one.
   *
   * Meant for a shortcut that duplicates a control the row already shows — ticking its checkbox,
   * say. The row is not focusable and answers to no key, so whatever this does must stay reachable
   * through that control.
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Whether a given row answers to `onRowClick`. Defaults to every row. A row that answers `false`
   * renders exactly as it would with no `onRowClick` at all — no pointer cursor, no click.
   */
  canClickRow?: (row: T, index: number) => boolean;
  /**
   * Row density — scales the gap between row cards and each card's padding, with the same
   * `'compact' | 'standard' | 'comfortable'` semantics as `DataTable` / `DataGrid`, so a global
   * density setting passes straight through. Defaults to `standard` (the current spacing).
   */
  density?: FormTableDensity;
  /**
   * Cell layout inside a row. `true` (default) lays the column inputs out side by side (each input
   * owns its own label); `false` stacks them under each other as a `PropertyList` of
   * `PropertyItem`s, each owning the column's `label` beside a bare input.
   */
  inline?: boolean;
  /** Disables the add / remove / clear-all affordances (inputs are disabled by the caller). */
  disabled?: boolean;
  /**
   * Disables only the "Add" affordance (e.g. every possible row is already present), leaving
   * existing rows removable. Independent of `disabled`, which turns off the whole table.
   */
  addDisabled?: boolean;
  /** Centered, muted message shown when there are no rows. */
  emptyMessage?: React.ReactNode;
  /** Label of the add button. Defaults to `Add`. */
  addLabel?: React.ReactNode;
  /** Label of the clear-all item in the overflow menu. Defaults to `Clear all`. */
  clearAllLabel?: React.ReactNode;
  /** Renders the row-count text in the footer. Defaults to `${count} items`. */
  countLabel?: (count: number) => React.ReactNode;
  /** Accessible label of a row's delete button. Defaults to `Remove row`. */
  removeRowLabel?: string;
  /** Accessible label of the overflow-menu trigger. Defaults to `More`. */
  moreLabel?: string;
  /** Extra styles merged onto the root. */
  sx?: SxProps<Theme>;
};

/**
 * The editable counterpart to `DataTable`: a form layout whose value is an **array of objects**
 * (rows), rendering each row as a neutral card of column inputs plus a trailing delete action, with
 * a footer that adds rows and (via a `⋮` overflow menu) clears them all. Purely presentational and
 * Panel-agnostic — drop it inside a `Panel` (`PanelContent`).
 *
 * `FormTable` owns only the row **structure**: `onChange` fires with the next array when a row is
 * added / removed / cleared. It does not manage cell values — each column's `render` supplies an
 * input that binds its own value, and may return `null` to hide a cell (e.g. conditional inputs);
 * empty cells still hold their track so columns stay aligned across rows.
 */
export const FormTable = <T,>({
  value,
  onChange,
  columns,
  createRow,
  getRowKey,
  canRemoveRow,
  onRowClick,
  canClickRow,
  density = 'standard',
  inline = true,
  disabled = false,
  addDisabled = false,
  emptyMessage,
  addLabel = 'Add',
  clearAllLabel = 'Clear all',
  countLabel = (count) => `${count} items`,
  removeRowLabel = 'Remove row',
  moreLabel = 'More',
  sx,
}: FormTableProps<T>) => {
  const add = () => onChange([...value, createRow()]);
  // Memoized (unlike `add`/`clearAll`, which aren't handed to a row): this is `FormTableRow`'s
  // `onRemove` prop, so a fresh closure here on every render would defeat `React.memo` on every row
  // regardless of whether `columns`/`row` actually changed — see `FormTableRow`.
  const removeAt = useCallback(
    (index: number) => onChange(value.filter((_, i) => i !== index)),
    [value, onChange]
  );
  const clearAll = () => onChange([]);

  const footerActions: ButtonDefinition[] = [
    {
      label: addLabel,
      icon: IconType.Add,
      color: 'inherit',
      disabled: disabled || addDisabled,
      onClick: add,
    },
    {label: clearAllLabel, onClick: clearAll, disabled: disabled || value.length === 0},
  ];

  const mergedSx: SxProps<Theme> = [...(Array.isArray(sx) ? sx : [sx])];

  return (
    <Box sx={mergedSx}>
      {value.length === 0 ? (
        emptyMessage != null && (
          <Typography variant={'body2'} sx={{color: 'text.secondary', textAlign: 'center', py: 2}}>
            {emptyMessage}
          </Typography>
        )
      ) : (
        <Stack spacing={DENSITY_ROW_CARD_GAP[density]}>
          {value.map((row, index) => (
            <FormTableRow
              key={getRowKey ? getRowKey(row, index) : index}
              row={row}
              index={index}
              columns={columns}
              inline={inline}
              disabled={disabled}
              padding={DENSITY_ROW_CARD_PADDING[density]}
              removable={canRemoveRow ? canRemoveRow(row, index) : true}
              removeRowLabel={removeRowLabel}
              onRemove={removeAt}
              onRowClick={!canClickRow || canClickRow(row, index) ? onRowClick : undefined}
            />
          ))}
        </Stack>
      )}

      <Box
        sx={{
          mt: value.length === 0 ? 0 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography variant={'body2'} sx={{color: 'text.secondary', pl: 1}}>
          {countLabel(value.length)}
        </Typography>
        <ButtonsStack
          surface={'button'}
          variant={'outlined'}
          size={'medium'}
          maxVisible={1}
          moreLabel={moreLabel}
          buttons={footerActions}
        />
      </Box>
    </Box>
  );
};
