import {useContext} from 'react';
import {SettingsContext} from './SettingsContext';

export const useSettingsContext = () => useContext(SettingsContext);
