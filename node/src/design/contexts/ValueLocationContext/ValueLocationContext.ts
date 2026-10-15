import {createContext} from 'react';
import {ValueLocationContextType} from './types';

const defaultValue: ValueLocationContextType = {
  isInCollection: false,
  isNested: false,
};

export const ValueLocationContext = createContext<ValueLocationContextType>(defaultValue);
