import {useSyncExternalStore} from 'react';
import {useTabsStore} from './useTabsStore';

export const useTabsLocation = () => {
  const store = useTabsStore();
  const tabs = useSyncExternalStore(store.subscribe, store.getTabs);

  return {
    tabs,
    setTab: store.setTab,
    removeTab: store.removeTab,
    getActiveTab: store.getActiveTab,
  };
};
