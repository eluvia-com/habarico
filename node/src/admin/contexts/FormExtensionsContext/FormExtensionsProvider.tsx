import React, {ReactNode, useCallback, useMemo, useState} from 'react';
import {FormExtensionsContext} from './FormExtensionsContext';

// Owns the form-extension registry state. Rendered high enough to cover both the registrants
// (form action buttons) and the renderer (`FormShell`).
export const FormExtensionsProvider = ({children}: {children: ReactNode}) => {
  const [formExtensions, setFormExtensions] = useState<Record<string, ReactNode>>({});

  const registerFormExtension = useCallback((id: string, node: ReactNode) => {
    setFormExtensions((prev) => ({...prev, [id]: node}));
  }, []);

  const unregisterFormExtension = useCallback((id: string) => {
    setFormExtensions((prev) => {
      const next = {...prev};
      delete next[id];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({formExtensions, registerFormExtension, unregisterFormExtension}),
    [formExtensions, registerFormExtension, unregisterFormExtension]
  );

  return <FormExtensionsContext.Provider value={value}>{children}</FormExtensionsContext.Provider>;
};
