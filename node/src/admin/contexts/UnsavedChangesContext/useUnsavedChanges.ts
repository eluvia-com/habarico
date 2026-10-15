import {useContext} from 'react';
import {UnsavedChangesContext, UnsavedChangesControlContext} from './UnsavedChangesContext';

/**
 * Re-renders the caller whenever the form's dirty state flips. Only for a caller that renders
 * something off the value; to read or write it from a handler or an effect use
 * `useUnsavedChangesControl`, which never re-renders.
 */
export const useUnsavedChanges = () => useContext(UnsavedChangesContext);

/**
 * Reads and writes the flag without subscribing — the context value never changes.
 * `getHasUnsavedChanges()` returns the value current at call time, so call it from a handler or an
 * effect, never during render.
 */
export const useUnsavedChangesControl = () => useContext(UnsavedChangesControlContext);
