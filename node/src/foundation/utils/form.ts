/**
 * Checks whether `value` is a plain (non-array, non-null) object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Returns a subset of `defaults` that contains only keys not present in `values`.
 * Recurses into nested plain objects — a nested key is omitted only when
 * the same key path exists in `values`.
 *
 * @param defaults - The default values object to filter
 * @param values   - Keys found here (at any depth) will be omitted from the result
 * @returns A new object with keys from `defaults` that are absent in `values`
 *
 * @example
 * omitDeepByValues({ a: 1, b: 2 }, { a: 99 })
 * // => { b: 2 }
 *
 * omitDeepByValues({ a: { x: 1, y: 2 } }, { a: { x: 99 } })
 * // => { a: { y: 2 } }
 */
export const omitDeepByValues = (
  defaults: Record<string, unknown>,
  values?: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (values && key in values) {
      const valueValue = values[key];

      if (isPlainObject(defaultValue) && isPlainObject(valueValue)) {
        const nested = omitDeepByValues(defaultValue, valueValue);

        if (Object.keys(nested).length > 0) {
          result[key] = nested;
        }
      }

      continue;
    }

    result[key] = defaultValue;
  }

  return result;
};
