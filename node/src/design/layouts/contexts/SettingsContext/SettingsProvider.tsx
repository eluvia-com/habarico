import React, {PropsWithChildren} from 'react';
import {SettingsContext} from './SettingsContext';
import {SettingsContextState} from './types';

export type SettingsProviderProps = PropsWithChildren<{value: SettingsContextState}>;

/**
 * Injects the presentational settings value into `SettingsContext`. The concrete value
 * (persistence, colour-mode bridge) is produced by the consuming layer — the admin store
 * or a Storybook mock — so this component is purely the context boundary. Lighter shells
 * (auth, simple) use it standalone; the dashboard composes it via `LayoutProvider`.
 */
export const SettingsProvider = ({value, children}: SettingsProviderProps) => (
  <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
);
