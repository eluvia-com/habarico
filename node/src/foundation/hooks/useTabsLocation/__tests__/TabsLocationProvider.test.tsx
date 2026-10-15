import React, {useEffect, useState} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it} from 'vitest';
import {render, waitFor} from '@testing-library/react';
import {TabsLocationProvider} from '../TabsLocationProvider';
import {useTabBox} from '../useTabBox';

// A tabbed layout built by hand, with no schema in sight — `useTabBox` is all it takes to own a
// tab path, and the cleanup below has to work for it exactly as it does for a schema tab box.
const TabBox = ({path}: {path: string}) => {
  const {activeTab, setTab} = useTabBox(path);
  return (
    <button onClick={() => setTab('1')}>
      {path}:{activeTab ?? '-'}
    </button>
  );
};

// The view is landed on carrying the hash of the view switched away from (`useGetLinkWithData`
// hands it over on purpose, so the open tab survives a show <-> edit switch). The provider reads
// the initial hash from the router, but writes go straight to `window.history` (deliberately
// behind the router's back — a `navigate()` would re-render every location subscriber in the app
// for a cosmetic hash update), so the real URL must carry the same hash the router is seeded with,
// exactly as it does in the app, and the assertions below read `window.location.hash`.
const renderArrivingWith = (hash: string, children: React.ReactNode, sync = true) => {
  window.history.replaceState(null, '', `/svc/res/1/edit${hash}`);
  return render(
    <MemoryRouter initialEntries={[`/svc/res/1/edit${hash}`]}>
      <TabsLocationProvider syncWithLocation={sync}>{children}</TabsLocationProvider>
    </MemoryRouter>
  );
};

const hash = () => window.location.hash;

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('TabsLocationProvider cleanup of tabs no tab box claims', () => {
  it('drops the tabs of a tab box the arrived-at view does not have', async () => {
    renderArrivingWith('#tabs=0.1,2.0', <TabBox path="0" />);

    await waitFor(() => expect(hash()).toBe('#tabs=0.1'));
  });

  it('keeps the tabs of the tab boxes the view does have', async () => {
    renderArrivingWith(
      '#tabs=0.1,2.0',
      <>
        <TabBox path="0" />
        <TabBox path="2" />
      </>
    );

    // The sweep runs a frame after the paint; give it that frame before asserting nothing changed.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1,2.0');
  });

  it('empties the hash on a view holding no tab box at all', async () => {
    renderArrivingWith('#tabs=0.1', <span />);

    await waitFor(() => expect(hash()).toBe(''));
  });

  // The sweep runs once, when the view has just been landed on. Everything after that is the
  // page's own doing — a tab box leaving the screen must not take the tab with it, or switching
  // an outer tab would quietly drop the tabs of everything nested inside the one being left.
  it('leaves the tabs alone when a tab box unmounts later', async () => {
    const {rerender} = renderArrivingWith(
      '#tabs=0.1,2.0',
      <>
        <TabBox path="0" />
        <TabBox path="2" />
      </>
    );
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1,2.0');

    rerender(
      <MemoryRouter initialEntries={['/svc/res/1/edit#tabs=0.1,2.0']}>
        <TabsLocationProvider syncWithLocation>
          <TabBox path="0" />
        </TabsLocationProvider>
      </MemoryRouter>
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1,2.0');
  });

  // The sweep waits for the frame after the paint, so a box the initial render only settles into
  // - mounted here by another component's mount effect - is still in time to claim its path.
  it('keeps the tab of a tab box the initial render only settles into', async () => {
    const LateTabBox = () => {
      const [shown, setShown] = useState(false);
      // Mounting a box from a mount effect is the pattern under test - the commit right after the
      // provider's, which the sweep has to wait for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      useEffect(() => setShown(true), []);
      return shown ? <TabBox path="2" /> : null;
    };

    renderArrivingWith(
      '#tabs=0.1,2.0',
      <>
        <TabBox path="0" />
        <LateTabBox />
      </>
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1,2.0');
  });

  // Where the guarantee ends: a box that arrives long after the view was painted - waiting on a
  // request of its own, or on a `show_query` the user only satisfies later - was not there to
  // claim anything, and its tab is gone by then.
  it('does not bring back the tab of a box arriving after the sweep', async () => {
    const {rerender} = renderArrivingWith('#tabs=0.1,2.0', <TabBox path="0" />);
    await waitFor(() => expect(hash()).toBe('#tabs=0.1'));

    rerender(
      <MemoryRouter initialEntries={['/svc/res/1/edit#tabs=0.1']}>
        <TabsLocationProvider syncWithLocation>
          <TabBox path="0" />
          <TabBox path="2" />
        </TabsLocationProvider>
      </MemoryRouter>
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1');
  });

  it('touches no URL for an overlay, whose store is private anyway', async () => {
    renderArrivingWith('#tabs=0.1', <span />, false);

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(hash()).toBe('#tabs=0.1');
  });
});
