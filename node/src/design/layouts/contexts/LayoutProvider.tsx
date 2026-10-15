import React, {PropsWithChildren} from 'react';
import {LayoutDynamicProvider, LayoutDynamicProviderConfig} from './LayoutDynamicContext';
import {SettingsContextState, SettingsProvider} from './SettingsContext';

export type LayoutProviderProps = PropsWithChildren<
  LayoutDynamicProviderConfig & {
    /** User settings value — persisted and colour-mode-bridged by the admin layer. */
    settings: SettingsContextState;
  }
>;

/**
 * Convenience provider that composes the two independent layout contexts —
 * `SettingsProvider` (presentation settings) and `LayoutDynamicProvider` (dynamic external
 * state). The full dashboard shell needs both; lighter shells (auth, simple) use
 * `SettingsProvider` alone.
 */
export const LayoutProvider = ({children, settings, ...dynamic}: LayoutProviderProps) => (
  <SettingsProvider value={settings}>
    <LayoutDynamicProvider {...dynamic}>{children}</LayoutDynamicProvider>
  </SettingsProvider>
);
