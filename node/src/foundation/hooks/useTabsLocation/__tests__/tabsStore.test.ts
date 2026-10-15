import {describe, expect, it, vi} from 'vitest';
import {createTabsStore} from '../tabsStore';

describe('tabsStore tab box registration', () => {
  it('drops the tabs no registered tab box claims', () => {
    const store = createTabsStore(['0.1', '2.0']);
    store.registerTabBox('0');

    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual(['0.1']);
  });

  it('keeps a nested tab through the registration of an ancestor tab box', () => {
    const store = createTabsStore(['0.1.2.0']);
    store.registerTabBox('0');

    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual(['0.1.2.0']);
  });

  it('matches whole segments, so tab box 1 does not claim the tabs of box 10', () => {
    const store = createTabsStore(['10.0']);
    store.registerTabBox('1');

    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual([]);
  });

  it('clears the list when the view registered no tab box at all', () => {
    const store = createTabsStore(['0.1']);

    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual([]);
  });

  it('keeps the claim while a second registration of the same path is still open', () => {
    const store = createTabsStore(['0.1']);
    const unregister = store.registerTabBox('0');
    store.registerTabBox('0');

    unregister();
    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual(['0.1']);
  });

  it('gives the path up once its last registration is gone', () => {
    const store = createTabsStore(['0.1']);
    const unregister = store.registerTabBox('0');

    unregister();
    store.pruneUnclaimedTabs();

    expect(store.getTabs()).toEqual([]);
  });

  it('notifies nobody when every tab is claimed', () => {
    const store = createTabsStore(['0.1']);
    store.registerTabBox('0');
    const listener = vi.fn();
    store.subscribe(listener);

    store.pruneUnclaimedTabs();

    expect(listener).not.toHaveBeenCalled();
  });
});
