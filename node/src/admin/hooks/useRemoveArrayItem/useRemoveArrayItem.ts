import {cloneDeep, get, set} from 'lodash-es';
import {useCallback} from 'react';
import {useWrappedSource} from 'react-admin';
import {useFormContext, useFormState} from 'react-hook-form';

/**
 * Removes a row from the surrounding react-hook-form field array **and keeps the form's default
 * values aligned with the shortened array**. Use it instead of `useArrayInput().remove` in any
 * array-input container.
 *
 * `useFieldArray`'s own `remove` re-indexes the current values, the registered fields, the errors
 * and the touched flags — but not the default values. Paths inside an array are positional, so once
 * a row is dropped, `<array>.<i>.<field>` in the defaults still describes the row that used to sit
 * at that index. Any input whose value is unset (an optional field the user left empty) then
 * re-registers on the shifted path, RHF resolves it as
 * `get(_formValues, name, get(_defaultValues, name))` and back-fills it from that stale default —
 * silently moving a value off the deleted row onto its neighbour, which is then saved.
 *
 * Re-seeding the defaults with the same index removed closes the gap. `keepValues` makes this a
 * defaults-only update, so the values `remove` just wrote stay as they are, and the remaining
 * `keep*` flags leave the form state (dirty / touched / errors / submit) exactly where it was — the
 * baseline still means "what the record carried", only without the removed row.
 */
export const useRemoveArrayItem = (remove: (index: number) => void) => {
  // `getSource('')` resolves the array's own absolute path (`orders`, `orders.0.items`, …) — the
  // documented way React Admin's own iterator asks for it.
  const source = useWrappedSource('');
  const {reset} = useFormContext();
  // Scoped to this array's own path - a keystroke into an unrelated field does not wake it. An
  // emission with no `name` (a `reset()`) still passes, which this hook needs: `reset` is what
  // moves `defaultValues`.
  const {defaultValues} = useFormState({name: source});

  return useCallback(
    (index: number) => {
      remove(index);

      const rows = get(defaultValues, source);
      // Nothing to realign when the record carried no defaults for this array (a create form, or a
      // row added in this session) — `remove` alone is then already correct.
      if (!Array.isArray(rows)) return;

      const nextDefaults = set(
        cloneDeep(defaultValues ?? {}),
        source,
        rows.filter((_row, rowIndex) => rowIndex !== index)
      );

      reset(nextDefaults, {
        keepValues: true,
        keepDirty: true,
        keepDirtyValues: true,
        keepTouched: true,
        keepErrors: true,
        keepIsSubmitted: true,
        keepSubmitCount: true,
      });
    },
    [defaultValues, remove, reset, source]
  );
};
