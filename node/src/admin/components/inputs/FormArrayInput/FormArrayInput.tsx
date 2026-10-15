import React, {useCallback, useMemo} from 'react';
import {
  ArrayInput as RaArrayInput,
  SourceContextProvider,
  useArrayInput,
  useSourceContext,
} from 'react-admin';
import {useFormArrayInputLabels} from '@admin/hooks/useFormArrayInputLabels';
import {useRemoveArrayItem} from '@admin/hooks/useRemoveArrayItem';
import {rowSourceContext} from '@admin/utils/sourceContext';
import {FormTable, type FormTableColumn, type FormTableDensity} from '@design/organisms/FormTable';
import type {DefaultValues} from '@typing';

// Deliberately does NOT extend the shared admin `InputProps`: this is a specialized field-array
// container (a `FormTable` of child inputs), not a single scalar input. Its surface (`children`
// column inputs, `defaultValue` row shape, `density`, `inline` layout) is specific to that role and
// does not map onto the standard label/helperText/validate input contract.
export type FormArrayInputProps = {
  /** Field-array source, relative to the surrounding form / source context (e.g. `owners`). */
  source: string;
  /** Column inputs — each a React Admin input carrying its own `source` (e.g. `name`, `email`). */
  children: React.ReactNode;
  /** Disables the add / remove / clear affordances and the row inputs. */
  disabled?: boolean;
  /** Shape of a newly added row. */
  defaultValue?: DefaultValues;
  /** Row density, forwarded to `FormTable`. */
  density?: FormTableDensity;
  /**
   * Column layout, forwarded to `FormTable`. `true` (default) lays the inputs out side by side,
   * each rendering its own label; `false` stacks them under each other as labelled property rows —
   * the child's `label` prop moves onto the `PropertyItem` and each input renders bare.
   */
  inline?: boolean;
};

/** A React Admin field-array row — `useFieldArray` stamps each entry with a stable `id`. */
type FieldRow = {id: string};

type FormTableIteratorProps = Omit<FormArrayInputProps, 'source' | 'children'> & {
  children: React.ReactNode;
};

/**
 * The connector between React Admin's field-array machinery and the design `FormTable`. Reads the
 * `useFieldArray` handle and the base source context, maps children to columns (each cell rendered
 * under a row-indexed source context), and bridges `FormTable`'s controlled-array `onChange` back to
 * the imperative `append` / `remove` / `replace` — diffing by the stable RHF `id` so an add / remove
 * touches a single row instead of remounting the whole list.
 */
const FormTableIterator = ({
  children,
  disabled,
  defaultValue,
  density,
  inline = true,
}: FormTableIteratorProps) => {
  const {fields, append, remove, replace} = useArrayInput();
  const parentSourceContext = useSourceContext();
  const labels = useFormArrayInputLabels();
  // Not `remove` directly: a bare field-array removal leaves the form's default values on their
  // pre-removal indexes, which RHF then back-fills onto the shifted rows. See the hook.
  const removeRow = useRemoveArrayItem(remove);

  const rows = fields as FieldRow[];

  // Memoized: `columns` is a `FormTableRow` prop, and a form with several array lists otherwise
  // re-renders every row of every list on any unrelated form change — a fresh `columns` array
  // (even with identical content) defeats `FormTableRow`'s `React.memo` regardless. `rows` (=
  // `fields`) is deliberately not a dep — react-hook-form only changes that reference on a
  // structural array mutation, never on a keystroke into a row's own value, so recomputing columns
  // off it would erase exactly the stability this memoizes for.
  const columns: FormTableColumn<FieldRow>[] = useMemo(
    () =>
      React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child, childIndex) => {
          const element = child as React.ReactElement<{
            source?: string;
            label?: React.ReactNode;
            disabled?: boolean;
          }>;
          const source = element.props.source;
          return {
            key: source ?? `col-${childIndex}`,
            label: element.props.label,
            // Whether *this row* actually renders stacked is decided per row by `FormTableRow` (a
            // narrow container falls back to stacked independently of `inline`, our own static
            // prop — see `FormTableColumn.render`), so the `label: false` override has to be
            // computed here, from `stacked`, rather than once from `inline` outside this closure.
            // Stacked: the surrounding `PropertyItem` owns the label, so the input renders bare.
            // Inline keeps the input's own label.
            render: (_row, rowIndex, {stacked}) => {
              const overrides: {disabled?: boolean; label?: false} = {};
              if (disabled) overrides.disabled = true;
              if (stacked) overrides.label = false;
              const cell = Object.keys(overrides).length
                ? React.cloneElement(element, overrides)
                : element;
              return (
                <SourceContextProvider value={rowSourceContext(parentSourceContext, rowIndex)}>
                  {cell}
                </SourceContextProvider>
              );
            },
          };
        }),
    [children, disabled, parentSourceContext]
  );

  // FormTable is a controlled array: it hands back the whole next array on add / remove / clear.
  // Translate that diff into a single surgical field-array mutation. Memoized for the same reason
  // as `columns` above: this is `FormTable`'s `onChange`, which its own `removeAt` (passed to every
  // row as `onRemove`) depends on — a fresh reference here defeats that memoization in turn.
  const handleChange = useCallback(
    (next: FieldRow[]) => {
      if (next.length === 0) {
        replace([]);
        return;
      }
      if (next.length > rows.length) {
        append(defaultValue ?? {});
        return;
      }
      if (next.length < rows.length) {
        const kept = new Set(next.map((row) => row.id));
        const removedIndex = rows.findIndex((row) => !kept.has(row.id));
        if (removedIndex >= 0) {
          removeRow(removedIndex);
        } else {
          replace(next);
        }
        return;
      }
      replace(next);
    },
    [rows, append, defaultValue, removeRow, replace]
  );

  return (
    <FormTable<FieldRow>
      value={rows}
      onChange={handleChange}
      columns={columns}
      createRow={() => ({...(defaultValue ?? {})}) as FieldRow}
      getRowKey={(row) => row.id}
      disabled={disabled}
      density={density}
      inline={inline}
      addLabel={labels.addLabel}
      clearAllLabel={labels.clearAllLabel}
      removeRowLabel={labels.removeRowLabel}
      moreLabel={labels.moreActionsLabel}
      emptyMessage={labels.emptyMessage}
      countLabel={labels.countLabel}
    />
  );
};

/**
 * Editable array input: renders a repeatable list of column inputs as the design `FormTable`.
 * Schema-agnostic — each child is a React Admin input carrying its own `source`, bound per row to
 * `source.{index}.{childSource}`. `inline` (default) lays the inputs out side by side; `inline={false}`
 * stacks them under each other as labelled property rows, moving each child's `label` onto its
 * `PropertyItem` and rendering the input bare.
 *
 * @example
 * <FormArrayInput source="owners">
 *   <TextInput source="name" label="Name" />
 *   <TextInput source="email" label="Email" />
 *   <ChoicesInput source="gender" label="Gender" choices={GENDERS} />
 * </FormArrayInput>
 */
export const FormArrayInput = ({source, children, ...rest}: FormArrayInputProps) => (
  // `null`, not omitted: React Admin defaults `ArrayInput`'s `defaultValue` to `[]`, which slips past
  // `useApplyInputDefaultValues`' `defaultValue == null` guard into `replace()` + `reset()` — from an
  // effect with no dependency array, so every render of every input reset the whole form. Nothing is
  // lost: this component's own `defaultValue` is the shape of a new *row*, and goes to the iterator.
  <RaArrayInput source={source} defaultValue={null} label={false} helperText={false}>
    <FormTableIterator {...rest}>{children}</FormTableIterator>
  </RaArrayInput>
);
