import {useCallback, useEffect, useSyncExternalStore} from 'react';
import {useTabsStore} from './useTabsStore';

/**
 * One tab box: the tab it currently shows, and how to switch it - addressed by the box\'s own path
 * (`getBoxName(schema.name)` for a schema box, any stable dotted string for a hand-built layout).
 *
 * Using it also claims that path for as long as the box is mounted, which is what lets the view
 * drop the tabs it did not put in the URL itself. Prefer it over reaching for `useTabsLocation`:
 * a tab box that sets tabs without claiming its path has its own tabs swept away (HAB-493).
 */
export const useTabBox = (path: string) => {
  const store = useTabsStore();

  useEffect(() => store.registerTabBox(path), [store, path]);

  // `useSyncExternalStore` re-renders only once the snapshot stops being `Object.is`-equal, and
  // `getActiveTab` returns a string — so this box wakes only when its own tab changes. Keep the
  // snapshot a primitive: the flat `store.getTabs()` list is a fresh array on every write, never
  // equal, which would re-render every tab box in the view whenever any one of them switches.
  const getSnapshot = useCallback(() => store.getActiveTab(path), [store, path]);
  const activeTab = useSyncExternalStore(store.subscribe, getSnapshot);

  const setTab = useCallback((value: string) => store.setTab(`${path}.${value}`), [store, path]);

  return {activeTab, setTab};
};
