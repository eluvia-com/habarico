import {createContext} from 'react';

// The subscribing half carries the value alone: writing belongs on the control context below, whose
// value never changes, so a consumer that only sets the flag cannot accidentally re-render on the
// flips it causes itself.
type UnsavedChangesContextType = {
  hasUnsavedChanges: boolean;
};

// A stable getter/setter pair: the context value never changes, so a consumer that needs the
// *current* value at event time (a click, an effect) subscribes here for free.
type UnsavedChangesControlType = {
  getHasUnsavedChanges: () => boolean;
  setHasUnsavedChanges: (value: boolean) => void;
};

export const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  hasUnsavedChanges: false,
});

export const UnsavedChangesControlContext = createContext<UnsavedChangesControlType>({
  getHasUnsavedChanges: () => false,
  setHasUnsavedChanges: () => {},
});
