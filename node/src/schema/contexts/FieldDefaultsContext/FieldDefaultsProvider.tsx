import React, {ReactNode, useMemo} from 'react';
import {FieldDefaults} from '@schema/types';
import {FieldDefaultsContext, useFieldDefaults} from './useFieldDefaults';

type FieldDefaultsProviderProps = FieldDefaults & {children: ReactNode};

/**
 * Publishes the field shapes for its subtree, **merged** over whatever the nearest provider above
 * already resolved — a resource naming one kind of field keeps the application's choice for the
 * rest, rather than resetting it to the built-in default. Nearest wins, key by key.
 */
export const FieldDefaultsProvider = ({
  children,
  reference,
  boolean,
  choices,
}: FieldDefaultsProviderProps) => {
  const parent = useFieldDefaults();

  // Memoized on the individual keys, never on a `fieldDefaults` object: the application writes
  // `fieldDefaults={{reference: 'link'}}` as an inline literal, which is a new identity on every
  // render and would invalidate the context for every field in the admin below. The same trap is
  // solved the same way in `ListConfigProvider` and `AdminConfigProvider`.
  const resolved = useMemo(
    () => ({
      reference: reference ?? parent.reference,
      boolean: boolean ?? parent.boolean,
      choices: choices ?? parent.choices,
    }),
    [reference, boolean, choices, parent.reference, parent.boolean, parent.choices]
  );

  return <FieldDefaultsContext.Provider value={resolved}>{children}</FieldDefaultsContext.Provider>;
};
