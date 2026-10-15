import {createContext} from 'react';
import {ParentBoxContextType} from './types';

export const ParentBoxContext = createContext<ParentBoxContextType | undefined>(undefined);
