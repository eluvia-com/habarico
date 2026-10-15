import {ReactElement} from 'react';
import {UserIdentity} from 'react-admin';
import {ServiceAuthProvider} from '@admin/providers/types';
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

export type SchemaRootContextState = {
  schemaProvider: SchemaProvider;
  dataProvider: ServiceDataProvider;
  authProvider: ServiceAuthProvider;
  servicesSchema: ServicesSchema;
  refetchSchema: () => void;
  serviceConfigMap: ServiceConfigMap;
  resources: {[name: string]: ReactElement};
  defaultRowAction: 'click' | 'double-click' | 'none';
  rowTooltip?: boolean;
  isLoaded: boolean;
  defaultFieldProvider: AdminFieldProvider;
  fieldProvider?: AdminFieldProvider;
  defaultInputProvider: AdminInputProvider;
  inputProvider?: AdminInputProvider;
  defaultValidatorProvider: AdminValidatorProvider;
  validatorProvider?: AdminValidatorProvider;
  defaultBoxProvider: AdminBoxProvider;
  boxProvider?: AdminBoxProvider;
  defaultButtonProvider: AdminButtonProvider;
  defaultViewProvider: AdminViewProvider;
  buttonProvider?: AdminButtonProvider;
  hasDashboard: boolean;
  userIdentity: UserIdentity | undefined;
  setUserIdentity: (identity: UserIdentity | undefined) => void;
};
