import React, {ReactNode, useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {TabsLocationContext} from './TabsLocationContext';
import {createTabsStore} from './tabsStore';
import {parseTabsFromHash, stringifyTabsToHash} from './utils';

export type TabsLocationProviderProps = {
  children: ReactNode;
  /**
   * Whether to mirror the tab store into the URL hash. `true` for a page's own tab boxes, so a
   * tabbed screen can be linked to and reloaded. `false` inside a dialog / side panel overlay, so
   * its tab store stays private, in-memory state that can never collide with the page's own hash
   * entries — mirrors react-admin's `TabbedShowLayout` / `TabbedForm` `syncWithLocation` prop.
   */
  syncWithLocation: boolean;
};

/**
 * `ViewContent` mounts exactly one of these per view (page, dialog or panel) - every tab box
 * rendered inside that view reads and writes the same store, regardless of nesting.
 */
export const TabsLocationProvider = ({children, syncWithLocation}: TabsLocationProviderProps) => {
  const {hash} = useLocation();
  const [store] = useState(() => createTabsStore(syncWithLocation ? parseTabsFromHash(hash) : []));

  // External navigation (initial load, back/forward, or a `navigate()` elsewhere touching the hash)
  // - resync the store so it never drifts from the address bar it mirrors. A no-op (via `replaceTabs`
  // guarding on equality) whenever the hash already matches what the store itself wrote below.
  useEffect(() => {
    if (!syncWithLocation) return;
    store.replaceTabs(parseTabsFromHash(hash));
  }, [hash, store, syncWithLocation]);

  // Mirrors every store write into the URL hash with `history.replaceState`, not react-router's
  // `navigate()`: a navigate publishes a new location object, so every `useLocation` consumer in the
  // app re-renders for what is a cosmetic hash update. The router's `location.hash` therefore goes
  // stale until the next real navigation — `useGetLinkWithData`, the one consumer that carries the
  // hash into links, reads `window.location.hash` for that reason. `history.state` is passed through
  // untouched: react-router keeps its own `{usr, key, idx}` bookkeeping there.
  useEffect(() => {
    if (!syncWithLocation) return;
    return store.subscribe(() => {
      const {pathname, search} = window.location;
      const nextHash = stringifyTabsToHash(store.getTabs());
      window.history.replaceState(window.history.state, '', `${pathname}${search}${nextHash}`);
    });
  }, [store, syncWithLocation]);

  // The hash a view is landed on is the previous view's (it is carried across a show <-> edit
  // switch on purpose), so it can hold tabs of a tab box this view does not have - and nothing
  // else would ever remove them. One sweep drops exactly those: every tab that no tab box on
  // screen has claimed through `useTabBox`.
  //
  // It waits for the frame after the view was painted rather than running in this effect directly,
  // so the whole initial render has settled first - a box mounted by another box's mount effect, a
  // dynamic box whose condition resolves from data already in hand. (A box waiting on a request of
  // its own still misses it and loses its tab; that is the documented edge.) And it runs once per
  // view: mounting and unmounting after that is the page switching its own tabs, not a new view.
  useEffect(() => {
    const frame = requestAnimationFrame(() => store.pruneUnclaimedTabs());
    return () => cancelAnimationFrame(frame);
  }, [store]);

  return <TabsLocationContext.Provider value={store}>{children}</TabsLocationContext.Provider>;
};
