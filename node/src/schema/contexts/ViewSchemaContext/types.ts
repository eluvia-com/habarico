import {Identifier} from 'react-admin';
import {MethodSchema, ViewSchema} from '@schema/types';

export type ViewSchemaContextType = {
  viewSchema: ViewSchema;
  methodSchema: MethodSchema;
  resource: string;
  recordId?: Identifier;
  actionName?: string;
};
