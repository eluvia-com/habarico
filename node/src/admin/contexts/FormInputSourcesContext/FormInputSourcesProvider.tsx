import React, {ReactNode, useCallback, useMemo, useState} from 'react';
import {
  FormInputSourcesContext,
  FormInputSourcesRegistrationContext,
} from './useFormInputSourcesContext';

export const FormInputSourcesProvider = ({children}: {children: ReactNode}) => {
  const [sources, setSources] = useState<string[]>([]);

  // `sources` is deliberately not a dependency of either callback: both read the current list
  // through the updater form, and depending on it would give them a new identity per registration —
  // which is exactly the whole-form re-render the two contexts below exist to avoid.
  const register = useCallback(
    (source: string) => {
      setSources((prev) => (prev.includes(source) ? prev : [...prev, source]));
    },
    [setSources]
  );

  const unregister = useCallback(
    (source: string) => {
      setSources((prev) => prev.filter((s) => s !== source));
    },
    [setSources]
  );

  // Two contexts: the callbacks are stable, so every input can subscribe to them for free, while
  // the `sources` list changes with each registration and only its own consumers pay for that.
  const registration = useMemo(() => ({register, unregister}), [register, unregister]);
  const value = useMemo(() => ({sources}), [sources]);

  return (
    <FormInputSourcesRegistrationContext.Provider value={registration}>
      <FormInputSourcesContext.Provider value={value}>{children}</FormInputSourcesContext.Provider>
    </FormInputSourcesRegistrationContext.Provider>
  );
};
