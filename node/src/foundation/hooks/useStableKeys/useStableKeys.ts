import {useMemo} from 'react';

/**
 * An object's keys as a referentially stable array — a new array is handed out only when the set of
 * keys itself changes. Use it wherever the key list is a memo dependency, a `React.memo` prop or a
 * context value, and a plain `Object.keys()` in the render body would defeat all three.
 *
 * Keyed on the joined names, so it holds for any key that cannot itself contain `|`.
 */
export const useStableKeys = (source: object | undefined): string[] => {
  const signature = Object.keys(source || {}).join('|');
  return useMemo(() => (signature ? signature.split('|') : []), [signature]);
};
