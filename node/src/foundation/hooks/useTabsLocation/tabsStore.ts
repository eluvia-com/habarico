export type TabsStore = {
  getTabs: () => string[];
  subscribe: (listener: () => void) => () => void;
  setTab: (value: string) => void;
  removeTab: (value: string) => void;
  getActiveTab: (parentValue: string) => string | undefined;
  replaceTabs: (tabs: string[]) => void;
  registerTabBox: (path: string) => () => void;
  pruneUnclaimedTabs: () => void;
};

const sameTabs = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * A plain, synchronous, router-agnostic container for the open-tabs list - the single
 * implementation of the tab rules (sibling-vs-descendant removal, active-tab lookup), shared by
 * every `useTabsLocation()` consumer regardless of where its state ends up living.
 * `TabsLocationProvider` either mirrors one of these into the URL hash (a page's own tab boxes) or
 * leaves it as private in-memory state (a dialog / side panel overlay), depending on its
 * `syncWithLocation` prop - either way, `useTabsLocation` reads it through `useSyncExternalStore`,
 * so a read is always synchronous and there is no render-lag window for a "no active tab yet"
 * effect to race against (the failure mode HAB-839 patched around).
 */
export const createTabsStore = (initialTabs: string[] = []): TabsStore => {
  let tabs = initialTabs;
  const listeners = new Set<() => void>();
  // Paths of the tab boxes currently on screen, each counted rather than flagged: React can mount
  // a second instance of a box before unmounting the first (StrictMode's remount, a re-keyed
  // subtree), and the path must stay claimed throughout.
  const claimedPaths = new Map<string, number>();
  const notify = () => listeners.forEach((listener) => listener());

  const setTab = (value: string) => {
    if (tabs.includes(value)) return;
    const parentBoxName = value.split('.').slice(0, -1).join('.') + '.';
    const descendantPrefix = value + '.';
    // Remove sibling tabs but keep descendants (e.g. "0.0" removes "0.1" but keeps "0.0.5.0").
    const filtered = tabs.filter(
      (t) => !t.startsWith(parentBoxName) || t.startsWith(descendantPrefix)
    );
    // Insert before descendants so the parent is found first by startsWith lookup.
    const firstDescendantIndex = filtered.findIndex((t) => t.startsWith(descendantPrefix));
    if (firstDescendantIndex >= 0) {
      filtered.splice(firstDescendantIndex, 0, value);
    } else {
      filtered.push(value);
    }
    tabs = filtered;
    notify();
  };

  const removeTab = (value: string) => {
    tabs = tabs.filter((t) => !t.startsWith(value));
    notify();
  };

  const getActiveTab = (value: string) => {
    const tab = tabs.find((t) => t.startsWith(value));
    return tab ? tab.slice(value.length + 1) : undefined;
  };

  // Overwrites the whole list without going through the sibling/descendant rules - used to hydrate
  // the store from an external change (e.g. the URL hash changing via back/forward navigation).
  const replaceTabs = (next: string[]) => {
    if (sameTabs(next, tabs)) return;
    tabs = next;
    notify();
  };

  // Whether some tab box on screen owns this tab. Whole segments only, so the box at `1` is not
  // handed the tabs of the box at `10`.
  const isClaimed = (tab: string) =>
    [...claimedPaths.keys()].some((path) => tab === path || tab.startsWith(`${path}.`));

  // Claims a tab path for as long as the tab box owning it is mounted; the returned function gives
  // it up again.
  const registerTabBox = (path: string) => {
    claimedPaths.set(path, (claimedPaths.get(path) ?? 0) + 1);
    return () => {
      const remaining = (claimedPaths.get(path) ?? 0) - 1;
      if (remaining > 0) claimedPaths.set(path, remaining);
      else claimedPaths.delete(path);
    };
  };

  // Drops every tab no tab box on screen claims - the ones a previous view left in the URL, which
  // nothing else would ever remove (a tab box only repairs entries under its own path). Called by
  // `TabsLocationProvider` once, right after the view it belongs to has mounted.
  const pruneUnclaimedTabs = () => replaceTabs(tabs.filter(isClaimed));

  return {
    getTabs: () => tabs,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTab,
    removeTab,
    getActiveTab,
    replaceTabs,
    registerTabBox,
    pruneUnclaimedTabs,
  };
};
