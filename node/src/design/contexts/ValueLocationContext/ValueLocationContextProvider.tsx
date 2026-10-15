import React, {ReactNode, useMemo} from 'react';
import {ValueLocationContext} from './ValueLocationContext';
import {ValueLocationContextType} from './types';
import {useValueLocationContext} from './useValueLocationContext';

type ValueLocationContextProviderProps = {
  value: Partial<ValueLocationContextType>;
  children: ReactNode;
};

export const ValueLocationContextProvider = ({
  value,
  children,
}: ValueLocationContextProviderProps) => {
  // There can be two nested instances of this context — one sets isInCollection and the
  // other sets isNested — so each unset flag inherits from the parent instead of resetting.
  const parent = useValueLocationContext();
  const isInCollection = value.isInCollection ?? parent.isInCollection;
  const isNested = value.isNested ?? parent.isNested;
  const merged = useMemo(() => ({isInCollection, isNested}), [isInCollection, isNested]);

  return <ValueLocationContext.Provider value={merged}>{children}</ValueLocationContext.Provider>;
};
