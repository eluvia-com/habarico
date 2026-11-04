import {Identifier} from 'react-admin';
import {ResourceDescriptor} from '@schema/contexts/ParentResourceDescriptorsContext/types';
import {
  ActionDescriptor,
  ActionSchema,
  ActionScopeType,
  AnyActionDescriptor,
  DefaultActionsDescriptor,
  ResourceActionSchema,
  ResourceReference,
} from '@schema/types';
import {generateActionSchema, generateActionSchemaMap, getTargetValues} from '../api';
import {DescriptorSource, generateDescriptorsFromSchema} from '../generateDescriptorsFromSchema';
import {referenceKey, resourceKey} from '../resourceReference';
import {
  ActionContext,
  ActionSurface,
  DescriptorResolution,
  LocalActions,
  ReferencedSchemasLookup,
} from './types';

const NO_SCHEMAS: ReferencedSchemasLookup = () => ({isLoading: false});

export const isDefaultActions = (item: AnyActionDescriptor): item is DefaultActionsDescriptor =>
  item.type === 'default_actions';

// `name` is required on a descriptor and absent from a schema; `type` cannot tell them apart,
// because a descriptor written in code may leave it out.
export const isActionDescriptor = (
  value: ActionDescriptor | ActionSchema
): value is ActionDescriptor => 'name' in value;

// A `DefaultActions` expands against the schema its reference loads; a named action is looked up in it.
const referenceToLoad = (descriptor: AnyActionDescriptor) =>
  isDefaultActions(descriptor) || !descriptor.action ? descriptor.reference : undefined;

/** Which of a resource's actions a `DefaultActions` entry stands for; unset means all of them. */
const scopeOf = (item: DefaultActionsDescriptor): ActionScopeType => item.scope ?? 'all';

/** The action a descriptor's `name` refers to among the ones a schema offers. */
const actionNamed = (actions: ResourceActionSchema[], name: string): ActionSchema | undefined =>
  generateActionSchemaMap(actions)[name];

const withMenuItems = (descriptors: AnyActionDescriptor[]): AnyActionDescriptor[] =>
  descriptors.flatMap((descriptor) =>
    isDefaultActions(descriptor)
      ? [descriptor]
      : [descriptor, ...withMenuItems(descriptor.menuItems ?? [])]
  );

/** Every distinct reference the descriptors (and their menu items) load actions from. */
export const collectDescriptorReferences = (
  descriptors: AnyActionDescriptor[]
): ResourceReference[] => {
  const references = withMenuItems(descriptors).flatMap(
    (descriptor) => referenceToLoad(descriptor) ?? []
  );
  return [...new Map(references.map((reference) => [referenceKey(reference), reference])).values()];
};

// `_target` is `{"<foreign key column>": <surrounding record id>}`: a record created through the
// address links back to the record the action is shown on.
const parentOf = (
  reference: ResourceReference,
  local: LocalActions
): ResourceDescriptor | undefined => {
  const link = getTargetValues(reference.params);
  if (!local.resource || !link || typeof link !== 'object') return undefined;
  const [target, recordId] = Object.entries(link as Record<string, Identifier>)[0] ?? [];
  return target ? {resource: local.resource, recordId, target} : undefined;
};

// A linked action binds to the record of its reference; without one it keeps the surrounding
// record only when that record belongs to the same resource.
const actionContextOf = (reference: ResourceReference, local: LocalActions): ActionContext => {
  const resource = resourceKey(reference);
  const recordPk = reference.recordPk ?? (resource === local.resource ? local.recordId : undefined);
  const parent = parentOf(reference, local);
  return parent ? {resource, recordPk, parent} : {resource, recordPk};
};

/**
 * The three ways a lookup ends, discriminated the same way `DescriptorResolution` is: the action was
 * found, the schema naming it is still loading, or no action of that name exists.
 */
type ActionLookup =
  {status: 'found'; action: ActionSchema} | {status: 'loading'} | {status: 'missing'};

const found = (action: ActionSchema | undefined): ActionLookup =>
  action ? {status: 'found', action} : {status: 'missing'};

const findAction = (
  descriptor: ActionDescriptor,
  local: LocalActions,
  schemas: ReferencedSchemasLookup
): ActionLookup => {
  if (descriptor.action) return {status: 'found', action: descriptor.action};
  if (!descriptor.reference) return found(actionNamed(local.actions, descriptor.name));
  const {schema, isLoading} = schemas(descriptor.reference);
  if (isLoading) return {status: 'loading'};
  return found(schema && actionNamed(schema.actions, descriptor.name));
};

/**
 * Resolves a descriptor to the action it renders: its inline `action`, else `name` looked up in the
 * schema its `reference` loads, else in the surrounding schema. A `reference` binds the action even
 * when `action` is inline. A menu resolves when any of its items does.
 */
export const resolveActionDescriptor = (
  descriptor: ActionDescriptor,
  local: LocalActions,
  schemas: ReferencedSchemasLookup = NO_SCHEMAS
): DescriptorResolution => {
  if (descriptor.menuItems) {
    const items = descriptor.menuItems.map((item) => resolveActionDescriptor(item, local, schemas));
    const resolved = items.find((item) => item.status === 'resolved');
    if (resolved) return resolved;
    return items.some((item) => item.status === 'loading')
      ? {status: 'loading'}
      : {status: 'invalid'};
  }
  const base = findAction(descriptor, local, schemas);
  if (base.status === 'loading') return {status: 'loading'};
  if (base.status === 'missing') return {status: 'invalid'};
  return {
    status: 'resolved',
    schema: generateActionSchema(base.action, descriptor),
    actionContext: descriptor.reference && actionContextOf(descriptor.reference, local),
  };
};

const defaultDescriptorsOf = (
  item: DefaultActionsDescriptor,
  local: LocalActions,
  schemas: ReferencedSchemasLookup,
  {isList, viewName}: ActionSurface
): ActionDescriptor[] => {
  const scope = scopeOf(item);
  const {reference} = item;
  if (!reference) return generateDescriptorsFromSchema(local.actions, isList, scope, viewName);
  const {schema} = schemas(reference);
  if (!schema) return [];
  // the address says the surface: a record makes it a detail, a collection a list
  const ownView = resourceKey(reference) === local.resource ? viewName : undefined;
  return generateDescriptorsFromSchema(
    schema.actions,
    reference.recordPk === undefined,
    scope,
    ownView
  ).map((descriptor) => ({...descriptor, reference}));
};

/**
 * Expands every `DefaultActionsDescriptor` among the descriptors into one descriptor per action it stands for;
 * one whose referenced schema has not loaded yet contributes nothing until it has.
 */
export const expandDefaultActions = (
  items: AnyActionDescriptor[],
  local: LocalActions,
  schemas: ReferencedSchemasLookup,
  surface: ActionSurface
): ActionDescriptor[] =>
  items.flatMap((item) =>
    isDefaultActions(item) ? defaultDescriptorsOf(item, local, schemas, surface) : [item]
  );

/** The inline `save` action among the descriptors — what a form's submit reads its `afterSave` from. */
export const findSaveAction = (
  items: AnyActionDescriptor[] | undefined
): ActionSchema | undefined =>
  items
    ?.flatMap((item) => (isDefaultActions(item) ? [] : (item.action ?? [])))
    .find((action) => action.type === 'save');

/**
 * Whether the descriptors can render any button for a resource offering `actions` — without the records at
 * hand: a named entry when the resource has that action, a linked or inline one always, a
 * `DefaultActions` of the resource itself when one of its actions qualifies.
 */
export const descriptorsMayRender = (
  items: AnyActionDescriptor[],
  actions: DescriptorSource[],
  isList: boolean
): boolean =>
  items.some((item) => {
    if (isDefaultActions(item)) {
      return (
        !!item.reference || generateDescriptorsFromSchema(actions, isList, scopeOf(item)).length > 0
      );
    }
    if (item.menuItems) return descriptorsMayRender(item.menuItems, actions, isList);
    return !!item.action || !!item.reference || actions.some(({name}) => name === item.name);
  });
