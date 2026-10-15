import React, {useCallback, useMemo} from 'react';
import {
  RecordContextProvider,
  SourceContextProvider,
  useArrayInput,
  useSourceContext,
} from 'react-admin';
import {FieldValues, useFormContext} from 'react-hook-form';
import {useFormArrayInputLabels} from '@admin/hooks/useFormArrayInputLabels';
import {useRemoveArrayItem} from '@admin/hooks/useRemoveArrayItem';
import {rowSourceContext} from '@admin/utils/sourceContext';
import {FormTable, type FormTableColumn} from '@design/organisms/FormTable';
import {Box, Checkbox} from '@mui/material';
import {SchemaInput} from '@schema/components/inputs/SchemaInput';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {BoxSchema} from '@schema/types';
import {excludeSchemaChoices, getTopLevelFieldDescriptors} from '@schema/utils/api';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';

export type SchemaChoicesFormIteratorProps = {
  schema: BoxSchema;
  source: string;
  /** Cell layout inside a row, forwarded to `FormTable`. Defaults to `true`. */
  inline?: boolean;
  /** Disables the whole table (add / remove / checkboxes / row inputs). */
  disabled?: boolean;
};

type IndexedField = FieldValues & {
  _index: number;
  _isGenerated?: boolean;
};

type FieldWithIndex = IndexedField & {
  _isChoiceRow: boolean;
  /**
   * Identity of the array item the row is bound to (the react-hook-form field id), as opposed to
   * `id`, which is the row's own stable key. They differ for a choice row: the row stays put while
   * the item under it can change — removing one of two rows carrying the same choice promotes the
   * other into this row. Cells key off this so they re-read the form on such a swap; the row card
   * itself keeps `id` and is never remounted, so its hover / focus state survives a toggle.
   */
  _itemId?: string;
};

export const SchemaChoicesFormIterator = ({
  schema,
  source,
  inline = true,
  disabled = false,
}: SchemaChoicesFormIteratorProps) => {
  const {append, fields, remove, replace} = useArrayInput();
  const {resetField} = useFormContext();
  const parentSourceContext = useSourceContext();
  const labels = useFormArrayInputLabels();

  // --------------------------------------------------------------------------
  // Prepare fields schema
  // --------------------------------------------------------------------------

  const fieldSchemas = useFieldSchemaMapContext();
  const targetFieldSchema = fieldSchemas[schema.array?.target || ''];
  // Memoized: feeds `columns` below (via `addField`/`toggleChoice`), which is itself memoized for
  // `FormTableRow`'s `React.memo` — an unmemoized map here would recompute (a fresh object) on
  // every render regardless, undoing that further down the chain.
  const fieldSchemaMap = useMemo(
    () =>
      generateFieldSchemaMap(
        targetFieldSchema?.items?.properties || [],
        getTopLevelFieldDescriptors(schema)
      ),
    [targetFieldSchema, schema]
  );
  // Not memoized on its own: it's only read inside the `rows` `useMemo` below (via `schema`, already
  // one of its deps), which is where the `|| []` fallback belongs — hoisting it here would recreate
  // that fallback array on every render regardless, and `rows`' own memoization would see a "new"
  // dependency each time even when the schema itself hasn't changed.
  const otherValues = schema.array?.listed?.otherValues;

  // --------------------------------------------------------------------------
  // Handle field changes
  // --------------------------------------------------------------------------

  // Not `remove` directly: a bare field-array removal leaves the form's default values on their
  // pre-removal indexes, which RHF then back-fills onto the shifted rows — an optional field left
  // empty inherits the value of the row that was deleted above it. See the hook.
  const removeField = useRemoveArrayItem(remove);

  const addField = useCallback(
    (item?: Record<string, unknown>) => {
      // Built field by field from the schema rather than spread from `item`: a row object carries
      // this component's own bookkeeping (`id`, `_index`, `_isGenerated`, `_isChoiceRow`,
      // `_itemId`), and spreading it wrote those keys into the form value — from where they went
      // out with the record on save.
      const defaultValue: Record<string, unknown> = {};

      Object.values(fieldSchemaMap).forEach((fieldSchema) => {
        defaultValue[fieldSchema.name] =
          item?.[fieldSchema.name] || fieldSchema.defaultValue || null;
      });

      append(defaultValue, {shouldFocus: false});
      // Make sure the newly added inputs are not considered dirty by react-hook-form
      resetField(`${source}.${fields.length}`, {defaultValue});
    },
    [append, resetField, source, fields.length, fieldSchemaMap]
  );

  // The one operation the checkbox and the row click share. A generated row is a placeholder — the
  // array holds nothing for that choice yet, so ticking it appends the item; a real one is dropped.
  // Memoized: it's a `columns` dependency (below), itself memoized for `FormTableRow`'s
  // `React.memo`.
  const toggleChoice = useCallback(
    (row: FieldWithIndex) => (row._isGenerated ? addField(row) : removeField(row._index)),
    [addField, removeField]
  );

  // --------------------------------------------------------------------------
  // Split fields into choice fields and others
  // --------------------------------------------------------------------------

  const choiceFieldName = schema.array?.listed?.fieldName;
  const fieldSchema = fieldSchemaMap[choiceFieldName || ''];

  // Memoized: `rows` is `FormTable`'s `value`, one row object per enum choice plus the "other"
  // fields — rebuilding it (fresh objects throughout) on every render, as before, meant no row ever
  // kept a stable identity across renders, which defeated `FormTableRow`'s `React.memo` regardless
  // of how stable `columns`/`onRemove` were made elsewhere. Guarded internally (not by an early
  // return above it) because a hook can't sit after a conditional return — see the actual early
  // return further down, after every hook in this component.
  const {rows, excludedChoices, showAdd} = useMemo(() => {
    if (!choiceFieldName || !fieldSchema || !fieldSchema.enum) {
      return {
        rows: [] as FieldWithIndex[],
        excludedChoices: [] as (string | number)[],
        showAdd: false,
      };
    }

    const resolvedOtherValues = otherValues || [];

    // Add index to each field
    const fieldsWithIndex: IndexedField[] = fields.map((field, _index) => ({...field, _index}));

    const choiceFieldsMap: {[key: string | number]: IndexedField} = fieldsWithIndex.reduce(
      (acc, field) => {
        if (field[choiceFieldName] && !acc[field[choiceFieldName]])
          acc[field[choiceFieldName]] = field;
        return acc;
      },
      {} as {[key: string | number]: IndexedField}
    );
    const enumWithoutOtherValues = fieldSchema.enum.filter(
      (choice) => !resolvedOtherValues.includes(choice.value)
    );

    // `id` is deliberately stable per enum choice — a checked row is not a different row from its
    // unchecked self, and `FormTable` keys rows by `id`. Letting it flip to/from the underlying RHF
    // field's real id on check/uncheck (as it did before) made React remount the row's DOM node on
    // every toggle, dropping its `:hover`/`:focus-within` state for a frame (a visible flash).
    const choiceFields: FieldWithIndex[] = enumWithoutOtherValues.map((choice) => ({
      ...choiceFieldsMap[choice.value],
      id: `choice:${choice.value}`,
      _itemId: choiceFieldsMap[choice.value]?.id,
      [choiceFieldName]: choice.value,
      _isGenerated: !choiceFieldsMap[choice.value],
      _isChoiceRow: true,
    }));
    // A real field is "other" unless it's the one claimed as a fixed choice row above — matched by
    // `_index` (stable), not `id` (now deliberately not, for choice rows — see above). Built from
    // `choiceFields` itself (not the broader `choiceFieldsMap`, which also covers `otherValues`), so
    // a field whose value is an `otherValues` entry (e.g. 'Jiné') stays correctly "other".
    const claimedIndexes = new Set(
      choiceFields.filter((field) => !field._isGenerated).map((field) => field._index)
    );
    const otherFields: FieldWithIndex[] = fieldsWithIndex
      .filter((field) => !claimedIndexes.has(field._index))
      .map((field) => ({...field, _itemId: field.id, _isChoiceRow: false}));

    // List of values that will be excluded from the other choices
    const excludedChoices = enumWithoutOtherValues
      .filter((choice) => !choiceFieldsMap[choice.value])
      .map((choice) => choice.value);

    // Add button is shown if there is at least one option in selected box
    const showAdd = Object.values(choiceFieldsMap).length !== 0 || resolvedOtherValues.length !== 0;

    return {rows: [...choiceFields, ...otherFields], excludedChoices, showAdd};
  }, [fields, choiceFieldName, fieldSchema, otherValues]);

  // --------------------------------------------------------------------------
  // FormTable wiring
  // --------------------------------------------------------------------------

  // FormTable is a controlled array, but its `value` (the always-visible checklist of enum choices
  // plus the "other" rows) is not a 1:1 mirror of the underlying field array — a checked choice, an
  // unchecked (synthesized) choice and an "other" row all look the same to it. Diff the array it
  // hands back against `rows` to recover which real change happened. Memoized: this is `FormTable`'s
  // `onChange`, which its own `removeAt` (passed to every row as `onRemove`) depends on.
  const handleChange = useCallback(
    (next: FieldWithIndex[]) => {
      if (next.length === 0) {
        replace([]);
        return;
      }
      if (next.length > rows.length) {
        addField();
        return;
      }
      if (next.length < rows.length) {
        const kept = new Set(next.map((row) => row.id));
        const removedRow = rows.find((row) => !kept.has(row.id));
        // An unchecked choice row is a synthesized placeholder — nothing exists yet to remove.
        if (removedRow && !removedRow._isGenerated) removeField(removedRow._index);
      }
    },
    [rows, replace, addField, removeField]
  );

  // Every column centers against the row's own natural height, so the checkbox, the choice label
  // and the other field(s) line up with each other as a group — not just the checkbox pinned to the
  // row's overall height while its siblings stay top-aligned against theirs. Memoized for
  // `FormTableRow`'s `React.memo` — see `rows` above for why an unmemoized `columns` here defeats it
  // regardless of `rows`' own stability.
  const columns: FormTableColumn<FieldWithIndex>[] = useMemo(
    () => [
      {
        key: 'checkbox',
        flex: 0.15,
        align: 'center' as const,
        render: (row: FieldWithIndex) =>
          row._isChoiceRow ? (
            // Wrapped: a centered cell stretches its child to the cell's full width (so the row's
            // inputs fill their column — see `FormTableColumn.align`), which a checkbox must not do
            // — its hover/ripple circle would stretch with it. The wrapper takes the width instead
            // and the checkbox keeps its own.
            <Box sx={{display: 'flex'}}>
              <Checkbox
                checked={!row._isGenerated}
                disabled={disabled}
                onChange={() => toggleChoice(row)}
              />
            </Box>
          ) : null,
      },
      ...Object.values(fieldSchemaMap).map((fs): FormTableColumn<FieldWithIndex> => ({
        key: fs.name,
        label: fs.label,
        align: 'center',
        // `stacked` reflects how this row actually renders (a narrow container falls back to
        // stacked row by row, independently of `inline` — see `FormTableColumn.render`): the
        // surrounding `PropertyItem` already shows `label` beside it then, so the input must not
        // also show its own, or the row ends up with two.
        render: (row, _rowIndex, {stacked}) => (
          // Keyed by the bound item, not by the row: when a removal swaps which array item this
          // row renders, the inputs remount and read the form again instead of keeping the value
          // they were mounted with.
          <RecordContextProvider
            key={row._itemId ?? row.id}
            value={{id: row.id || row._index, ...row}}
          >
            <SourceContextProvider
              value={rowSourceContext(parentSourceContext, row._isGenerated ? row.id : row._index)}
            >
              <SchemaInput
                label={stacked ? false : fs.label}
                schema={
                  !row._isChoiceRow && fs.name === choiceFieldName
                    ? excludeSchemaChoices(fs, excludedChoices)
                    : fs
                }
                source={fs.name}
                readOnly={fs.readOnly || (row._isChoiceRow && fs.name === choiceFieldName)}
                disabled={disabled || row._isGenerated}
              />
            </SourceContextProvider>
          </RecordContextProvider>
        ),
      })),
    ],
    [disabled, fieldSchemaMap, choiceFieldName, excludedChoices, parentSourceContext, toggleChoice]
  );

  if (!source || !choiceFieldName || !fieldSchema || !fieldSchema.enum) return;

  return (
    <FormTable<FieldWithIndex>
      value={rows}
      onChange={handleChange}
      columns={columns}
      createRow={() => ({id: '__pending__', _index: -1, _isChoiceRow: false})}
      getRowKey={(row) => row.id}
      // A choice row never carries a delete button: unticking its checkbox is what removes the
      // choice, so a second control doing the same thing beside it is noise — and on an unticked
      // row the array holds nothing to delete at all. Only the free ("other") rows, which have no
      // checkbox of their own, keep it. Hidden rather than unmounted (see `canRemoveRow`), so the
      // rows still line up with each other.
      canRemoveRow={(row) => !row._isChoiceRow}
      // Clicking the row is the same gesture as ticking its checkbox, just over the whole card: the
      // row's hover tint already reads as clickable, and on an unticked row every input is disabled,
      // so nearly the whole surface is dead space the user has no other reason to click. A ticked
      // row's inputs are live and keep their own clicks (see `FormTable.onRowClick`), which also
      // means a half-typed value can't be dropped by a stray click while the user is editing it.
      onRowClick={toggleChoice}
      // A free ("other") row has no checkbox — there is nothing for a click on it to toggle.
      canClickRow={(row) => row._isChoiceRow}
      inline={inline}
      disabled={disabled}
      addDisabled={!showAdd}
      addLabel={labels.addLabel}
      clearAllLabel={labels.clearAllLabel}
      removeRowLabel={labels.removeRowLabel}
      moreLabel={labels.moreActionsLabel}
      emptyMessage={labels.emptyMessage}
      // The checklist always renders a row per enum value, so `FormTable`'s own row count would
      // read "5 items" for an empty record. Count the array instead — what the record holds.
      countLabel={() => labels.countLabel(fields.length)}
    />
  );
};
