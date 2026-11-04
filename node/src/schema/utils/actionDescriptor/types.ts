import {Identifier} from 'react-admin';
import {ResourceDescriptor} from '@schema/contexts/ParentResourceDescriptorsContext/types';
import {
  ActionSchema,
  LocalResourceSchema,
  ResourceActionSchema,
  ResourceReference,
} from '@schema/types';

/** What a linked action runs against instead of the surrounding resource and record. */
export type ActionContext = {
  // the `service/resource` key
  resource: string;
  recordPk?: Identifier;
  // the surrounding record the addressed resource links back to, from `params._target`
  parent?: ResourceDescriptor;
};

/** The schema a reference loads; `schema` stays unset while loading or on failure. */
export type ReferencedSchema = {schema?: LocalResourceSchema; isLoading: boolean};

export type ReferencedSchemasLookup = (reference: ResourceReference) => ReferencedSchema;

/** The resource (and record) the descriptors render on, with the actions it offers. */
export type LocalActions = {
  actions: ResourceActionSchema[];
  resource?: string;
  recordId?: Identifier;
};

export type DescriptorResolution =
  | {status: 'resolved'; schema: ActionSchema; actionContext?: ActionContext}
  | {status: 'loading'}
  | {status: 'invalid'};

/** How the surface the descriptors render on reads the actions a `DefaultActionsDescriptor` stands for. */
export type ActionSurface = {
  // a list surface keeps `showInList` actions, a detail one `showInDetail`
  isList: boolean;
  // the view the descriptors belong to — an action opening that same view is left out
  viewName?: string;
};
