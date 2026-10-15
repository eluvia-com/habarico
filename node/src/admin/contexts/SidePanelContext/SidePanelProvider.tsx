import React, {ReactNode, useCallback, useMemo, useState} from 'react';
import {SidePanelContext} from './SidePanelContext';
import {SidePanelController} from './types';

// Owns the docked side panel state for a list. `openView` replaces the current view (so
// clicking another row swaps the preview in place); `close` clears it. The payload is opaque
// here (`unknown`) — consumers read it back through their own `useSidePanelController<TView>()`.
export const SidePanelProvider = ({children}: {children: ReactNode}) => {
  const [active, setActive] = useState<unknown>(undefined);

  const openView = useCallback((view: unknown) => setActive(view), []);
  const close = useCallback(() => setActive(undefined), []);

  const value = useMemo<SidePanelController>(
    () => ({active, openView, close}),
    [active, openView, close]
  );

  return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
};
