import React, {ReactElement} from 'react';
import {Identifier, ResourceProps} from 'react-admin';
import {Route} from 'react-router-dom';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {DashboardContent} from '@design/layouts/dashboard';
import {ResourceBoxProvider} from '@schema/contexts/ResourceBoxContext';
import {ResourceButtonProvider} from '@schema/contexts/ResourceButtonContext';
import {ResourceFieldProvider} from '@schema/contexts/ResourceFieldContext';
import {ResourceInputProvider} from '@schema/contexts/ResourceInputContext';
import {
  ResourceBoxProvider as ResourceBoxProviderType,
  ResourceButtonProvider as ResourceButtonProviderType,
  ResourceFieldProvider as ResourceFieldProviderType,
  ResourceInputProvider as ResourceInputProviderType,
} from '@schema/providers/types';
import {GlobalViewSchema, ViewType} from '@schema/types';
import {isRoutedViewMode} from '@schema/utils/viewMode';

export type ViewProps = {
  id?: Identifier;
  params?: Record<string, string>;
  redirect?: false | string;
  onSuccess?: () => void;
};

export type GetViewWithProvidersProps = {
  view?: ReactElement;
  inputProvider?: ResourceInputProviderType;
  fieldProvider?: ResourceFieldProviderType;
  boxProvider?: ResourceBoxProviderType;
  buttonProvider?: ResourceButtonProviderType;
  properties?: ViewProps;
};

export const getViewWithProviders = ({
  view,
  inputProvider,
  fieldProvider,
  boxProvider,
  buttonProvider,
}: GetViewWithProvidersProps) => {
  if (!view) return;

  let viewWithProviders = view;
  if (inputProvider) {
    viewWithProviders = (
      <ResourceInputProvider provider={inputProvider}>{viewWithProviders}</ResourceInputProvider>
    );
  }
  if (fieldProvider) {
    viewWithProviders = (
      <ResourceFieldProvider provider={fieldProvider}>{viewWithProviders}</ResourceFieldProvider>
    );
  }
  if (boxProvider) {
    viewWithProviders = (
      <ResourceBoxProvider provider={boxProvider}>{viewWithProviders}</ResourceBoxProvider>
    );
  }
  if (buttonProvider) {
    viewWithProviders = (
      <ResourceButtonProvider provider={buttonProvider}>{viewWithProviders}</ResourceButtonProvider>
    );
  }
  return viewWithProviders;
};

// Self-container for routed schema resource views (inline mode). Unlike `BaseAdminLayout`, which wraps
// all uniform admin content once, schema views are heterogeneous and each brings its own container —
// this one mirrors the former `AdminPageContent` (HAB-668). It must be a component (not inlined into the
// plain `getViewWithProvidersWithPageContent` helper) so it can read `useAdminConfig` inside the render.
// This is a helpers module, not a component boundary, so the react-refresh constraint does not apply.
// eslint-disable-next-line react-refresh/only-export-components
const PageContent = ({children}: {children: React.ReactNode}) => {
  const {contentMaxWidth} = useAdminConfig();
  return (
    <DashboardContent maxWidth={contentMaxWidth} sx={{minWidth: 320}}>
      {children}
    </DashboardContent>
  );
};

export const getViewWithProvidersWithPageContent = (props: GetViewWithProvidersProps) => {
  const view = getViewWithProviders(props);
  if (!view) return;
  return <PageContent>{view}</PageContent>;
};

// A reserved view is wired into react-admin's `<Resource>` (and thus gets a router path)
// only when its mode is inline. modal/sidepanel views are opened from a trigger instead.
export const resolveView = (
  viewSchema: GlobalViewSchema | undefined,
  viewEl: ReactElement | null | undefined
): ReactElement | undefined =>
  viewSchema && isRoutedViewMode(viewSchema.mode) && viewEl ? viewEl : undefined;

export const renderSubResourceRoutes = (
  subResourceEl: ReactElement | null | undefined
): ReactElement | null => {
  if (!subResourceEl) return null;
  return (
    <>
      <Route path="r/:serviceName/:resourceName/*" element={subResourceEl} />
      <Route path=":id/n/:target/:serviceName/:resourceName/*" element={subResourceEl} />
      <Route path=":id/show/n/:target/:serviceName/:resourceName/*" element={subResourceEl} />
      <Route path=":id/r/:serviceName/:resourceName/*" element={subResourceEl} />
      <Route path=":id/show/r/:serviceName/:resourceName/*" element={subResourceEl} />
    </>
  );
};

export const isResourceElement = (el: ReactElement): el is ReactElement<ResourceProps> =>
  (el.type as {raName?: string}).raName === 'Resource';

export const hasViewProp = <T extends ViewType>(
  el: ReactElement | undefined,
  viewType: T
): el is ReactElement<Record<T, ReactElement>> =>
  !!el && typeof el.props === 'object' && el.props !== null && viewType in el.props;
