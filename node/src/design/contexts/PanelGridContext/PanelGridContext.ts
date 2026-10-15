import {createContext} from 'react';
import {ColumnsType} from './types';

export const PanelGridContext = createContext<ColumnsType | undefined>(undefined);
