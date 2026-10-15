import React, {PropsWithChildren, useEffect} from 'react';
import {_breadcrumbs, _currentUser, _notifications} from '../_mock';
import {useLayoutDynamicContext} from './LayoutDynamicContext';
import {LayoutProvider} from './LayoutProvider';
import {useMockSettings} from './SettingsContext';

// Seeds the mock breadcrumbs / notifications into the dynamic context via its setters (they are no
// longer provider props). Mirrors how a concrete view populates them at runtime.
const SeedMockDynamic = ({children}: PropsWithChildren) => {
  const {setBreadcrumbs, setNotifications} = useLayoutDynamicContext();
  useEffect(() => {
    setBreadcrumbs(_breadcrumbs);
    setNotifications(_notifications);
  }, [setBreadcrumbs, setNotifications]);
  return <>{children}</>;
};

/**
 * Storybook / isolated-render provider: wires local-state mock settings (via
 * `useMockSettings`) and mock dynamic data (breadcrumbs, user, notifications) through the
 * real `LayoutProvider`.
 */
export const LayoutMockProvider = ({children}: PropsWithChildren) => {
  const settings = useMockSettings();
  return (
    <LayoutProvider settings={settings} currentUser={_currentUser}>
      <SeedMockDynamic>{children}</SeedMockDynamic>
    </LayoutProvider>
  );
};
