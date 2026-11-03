import React, {ReactNode, useContext} from 'react';
import {ReadOnlyBoxContext} from './ReadOnlyBoxContext';

type ReadOnlyBoxProviderProps = {
  /** `true` makes the subtree read-only; `false` leaves whatever scope it already sits in. */
  readOnly: boolean;
  children: ReactNode;
};

/**
 * Scopes a box subtree to read-only. The scope only ever turns **on**: a box that declares
 * `read_only: false` inside a read-only one stays read-only, which is what the backends emit — a
 * read-only array box carries plain children (`read_only: false` is the box default), and they must
 * not re-open the form the parent closed. Mirrors `BaseBox.get_read_only()` in the Python library
 * (`context.read_only or self._read_only`).
 *
 * Mounts nothing when it has nothing to add, so the common (writeable) box pays no provider.
 */
export const ReadOnlyBoxProvider = ({readOnly, children}: ReadOnlyBoxProviderProps) => {
  const inheritedReadOnly = useContext(ReadOnlyBoxContext);

  if (!readOnly || inheritedReadOnly) return children;

  return <ReadOnlyBoxContext.Provider value={true}>{children}</ReadOnlyBoxContext.Provider>;
};
