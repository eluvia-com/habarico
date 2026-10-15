import {Identifier} from 'react-admin';

export type ResourceDescriptor = {
  resource: string;
  recordId?: Identifier;
  target?: string;
};
