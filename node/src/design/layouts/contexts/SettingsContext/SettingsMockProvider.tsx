import React, {PropsWithChildren} from 'react';
import {SettingsProvider} from './SettingsProvider';
import {useMockSettings} from './useMockSettings';

/**
 * Storybook / isolated-render provider that injects local-state mock settings into
 * `SettingsContext`. The dashboard shell additionally needs dynamic state — use
 * `LayoutMockProvider` there; the lighter auth / simple shells use this alone.
 */
export const SettingsMockProvider = ({children}: PropsWithChildren) => (
  <SettingsProvider value={useMockSettings()}>{children}</SettingsProvider>
);
