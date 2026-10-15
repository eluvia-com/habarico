import {createContext} from 'react';
import {TabsStore} from './tabsStore';

export const TabsLocationContext = createContext<TabsStore | undefined>(undefined);
