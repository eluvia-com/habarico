import React, {ReactElement} from 'react';
import {ResourceProps} from 'react-admin';
import {
  ResourceBoxProvider as ResourceBoxProviderType,
  ResourceButtonProvider as ResourceButtonProviderType,
  ResourceFieldProvider as ResourceFieldProviderType,
  ResourceInputProvider as ResourceInputProviderType,
} from '@schema/providers/types';
import {FieldDefaults} from '@schema/types';

export type SchemaResourceProps = ResourceProps & {
  inputProvider?: ResourceInputProviderType;
  fieldProvider?: ResourceFieldProviderType;
  boxProvider?: ResourceBoxProviderType;
  buttonProvider?: ResourceButtonProviderType;
  // The shape each kind of field takes inside this resource. Merged over `SchemaAdmin`'s
  // `fieldDefaults` key by key — an omitted key keeps the admin-wide choice.
  fieldDefaults?: FieldDefaults;
  list?: ReactElement;
  create?: ReactElement;
  edit?: ReactElement;
  show?: ReactElement;
};

// Resource components that works only as a descriptor/configuration of the final admin resource
export const SchemaResource = (_props: SchemaResourceProps) => {
  return <></>;
};

SchemaResource.raName = 'SchemaResource';
