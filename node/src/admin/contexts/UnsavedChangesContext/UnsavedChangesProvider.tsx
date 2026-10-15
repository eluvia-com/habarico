import React, {useCallback, useMemo, useRef, useState} from 'react';
import {UnsavedChangesContext, UnsavedChangesControlContext} from './UnsavedChangesContext';

export const UnsavedChangesProvider = ({children}: {children: React.ReactNode}) => {
  const [hasUnsavedChangesState, setHasUnsavedChangesState] = useState(false);
  // Mirrored in a ref so the control context's getter can stay identity-stable.
  const hasUnsavedChangesRef = useRef(false);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    hasUnsavedChangesRef.current = value;
    setHasUnsavedChangesState(value);
  }, []);

  const getHasUnsavedChanges = useCallback(() => hasUnsavedChangesRef.current, []);

  const control = useMemo(
    () => ({getHasUnsavedChanges, setHasUnsavedChanges}),
    [getHasUnsavedChanges, setHasUnsavedChanges]
  );

  const value = useMemo(
    () => ({hasUnsavedChanges: hasUnsavedChangesState}),
    [hasUnsavedChangesState]
  );

  return (
    <UnsavedChangesControlContext.Provider value={control}>
      <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
    </UnsavedChangesControlContext.Provider>
  );
};
