import {createContext} from 'react';
import {SidePanelController} from './types';

export const SidePanelContext = createContext<SidePanelController | undefined>(undefined);
