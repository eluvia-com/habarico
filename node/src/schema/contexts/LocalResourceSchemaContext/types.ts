import {Identifier} from 'react-admin';
import {LocalResourceSchema} from '@schema/types';
import {DataType} from '@typing';

export type LocalResourceSchemaContextType = {
  resource: string;
  actionName?: string;
  recordId?: Identifier;
  params?: DataType;
  schema: LocalResourceSchema;
};
