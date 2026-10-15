import {createContext} from 'react';
import {LayoutDynamicContextState} from './types';

const noop = () => {};

export const LayoutDynamicContext = createContext<LayoutDynamicContextState>({
  breadcrumbs: [],
  setBreadcrumbs: noop,
  currentUser: null,
  notifications: [],
  setNotifications: noop,
});
