import {useContext} from 'react';
import {LayoutDynamicContext} from './LayoutDynamicContext';

export const useLayoutDynamicContext = () => {
  const context = useContext(LayoutDynamicContext);
  if (!context) {
    throw new Error('useLayoutDynamicContext must be used within a LayoutDynamicProvider');
  }
  return context;
};
