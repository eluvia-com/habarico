import React, {ReactElement, ReactNode, useMemo} from 'react';
import {UserIdentity} from 'react-admin';
import {ServiceAuthProvider} from '@admin/providers/types';
import {useGetServiceSchemas} from '@schema/hooks/useGetServiceSchemas';
import {
  AdminBoxProvider,
  AdminButtonProvider,
  AdminFieldProvider,
  AdminInputProvider,
  AdminValidatorProvider,
  AdminViewProvider,
  SchemaProvider,
  ServiceDataProvider,
} from '@schema/providers/types';
import {ServicesSchema} from '@schema/types';
import {ServiceConfigMap} from '@typing';
import {SchemaRootContext} from './useSchemaRootContext';

type SchemaRootContextProviderValue = {
  serviceConfigMap: Readonly<ServiceConfigMap>;
  schemaProvider: SchemaProvider;
  dataProviderFactory: (
    servicesSchema: ServicesSchema,
    getAuthHeaders: () => Record<string, string>
  ) => ServiceDataProvider;
  authProvider: ServiceAuthProvider;
  fieldProvider?: AdminFieldProvider;
  defaultFieldProvider: AdminFieldProvider;
  inputProvider?: AdminInputProvider;
  defaultInputProvider: AdminInputProvider;
  validatorProvider?: AdminValidatorProvider;
  defaultValidatorProvider: AdminValidatorProvider;
  boxProvider?: AdminBoxProvider;
  defaultBoxProvider: AdminBoxProvider;
  buttonProvider?: AdminButtonProvider;
  defaultButtonProvider: AdminButtonProvider;
  defaultViewProvider: AdminViewProvider;
  defaultRowAction: 'click' | 'double-click' | 'none';
  rowTooltip?: boolean;
  resources: {[name: string]: ReactElement};
  // Internal only — drives the schema fetch (`useGetServiceSchemas` runs above `<Admin>`, where
  // `useLocaleState` is unavailable). Seeded from the RA store in `SchemaAdmin` and excluded from the
  // exposed context value, so it is NOT a second source of truth for locale.
  locale: string;
  hasDashboard: boolean;
  // The signed-in user, held above this provider together with the per-user store scoped by it (in
  // `SchemaAdmin`, or by `usePerUserStore` in a hand-assembled provider), and kept current through
  // `setUserIdentity` by `SchemaIdentitySync` inside `<Admin>`.
  userIdentity: UserIdentity | undefined;
  setUserIdentity: (identity: UserIdentity | undefined) => void;
};

type SchemaRootContextProviderProps = {
  value: SchemaRootContextProviderValue;
  children: ReactNode;
};

export const SchemaRootContextProvider = ({value, children}: SchemaRootContextProviderProps) => {
  const {serviceConfigMap, schemaProvider, authProvider, dataProviderFactory, userIdentity} = value;

  // Static app-level config — changes only when value prop itself changes (app init)
  const staticProps = useMemo(() => {
    // eslint-disable-next-line sonarjs/no-unused-vars -- exclude the factory + internal-only locale from the spread
    const {dataProviderFactory: _dataProviderFactory, locale: _locale, ...rest} = value;
    return rest;
  }, [value]);

  const {isLoaded, servicesSchema, refetch} = useGetServiceSchemas(
    serviceConfigMap,
    schemaProvider,
    value.locale,
    userIdentity,
    () => authProvider.isAuthenticated()
  );

  const dataProvider = useMemo(
    () => dataProviderFactory(servicesSchema, authProvider.getAuthHeaders),
    [dataProviderFactory, servicesSchema, authProvider]
  );

  const contextValue = useMemo(
    () => ({
      ...staticProps,
      isLoaded,
      servicesSchema,
      dataProvider,
      refetchSchema: refetch,
    }),
    [staticProps, isLoaded, servicesSchema, dataProvider, refetch]
  );

  return <SchemaRootContext.Provider value={contextValue}>{children}</SchemaRootContext.Provider>;
};
