import {useContext} from 'react';
import {TabsLocationContext} from './TabsLocationContext';

// The store of the enclosing view, for the hooks in this folder. Not part of the public surface -
// `useTabsLocation` and `useTabBox` are.
export const useTabsStore = () => {
  const store = useContext(TabsLocationContext);
  if (!store) {
    throw new Error(
      'useTabsLocation must be rendered under a TabsLocationProvider. ViewContent mounts one ' +
        'automatically for every view, page or overlay alike.'
    );
  }
  return store;
};
