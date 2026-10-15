import React, {PropsWithChildren, useMemo, useState} from 'react';
import {LayoutBreadcrumb, LayoutNotification, LayoutUser} from '../../types';
import {LayoutDynamicContext} from './LayoutDynamicContext';

export type LayoutDynamicProviderConfig = {
  currentUser: LayoutUser | null;
};

export type LayoutDynamicProviderProps = PropsWithChildren<LayoutDynamicProviderConfig>;

/**
 * Provides the layout's dynamic external state — breadcrumbs, current user, notifications — plus the
 * title / actions portal refs it manages internally. `breadcrumbs` and `notifications` are internal
 * state seeded by a concrete view via `setBreadcrumbs` / `setNotifications` (not props); only
 * `currentUser` comes in as a prop. Settings are a separate concern (`SettingsProvider`); use
 * `LayoutProvider` to compose both.
 */
export const LayoutDynamicProvider = ({children, currentUser}: LayoutDynamicProviderProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<LayoutBreadcrumb[]>([]);
  const [notifications, setNotifications] = useState<LayoutNotification[] | null>(null);
  const [actionsContainer, setActionsContainer] = useState<HTMLDivElement>();
  const [titleContainer, setTitleContainer] = useState<HTMLDivElement>();
  const [breadcrumbsContainer, setBreadcrumbsContainer] = useState<HTMLOListElement>();

  const value = useMemo(
    () => ({
      breadcrumbs,
      setBreadcrumbs,
      currentUser,
      notifications,
      setNotifications,
      actionsContainer,
      setActionsContainer,
      titleContainer,
      setTitleContainer,
      breadcrumbsContainer,
      setBreadcrumbsContainer,
    }),
    [
      breadcrumbs,
      currentUser,
      notifications,
      actionsContainer,
      titleContainer,
      breadcrumbsContainer,
    ]
  );

  return <LayoutDynamicContext.Provider value={value}>{children}</LayoutDynamicContext.Provider>;
};
