import {ActionDescriptor, ActionSchema, ResourceActionSchema} from '@schema/types';
import {
  ActionContext,
  LocalActions,
  ReferencedSchemasLookup,
  resolveActionDescriptor,
} from '@schema/utils/actionDescriptor';
import {generateActionSchemaMap} from '@schema/utils/api';

export type RowAction = {schema: ActionSchema; actionContext?: ActionContext};

// The two arguments `resolveActionDescriptor` takes, minus the actions this function already has as
// its first parameter: the list's `service/resource` key with the activated row, plus the schemas the
// descriptor's reference loads — fetched beforehand so this stays synchronous.
type RowContext = Omit<LocalActions, 'actions'> & {schemas?: ReferencedSchemasLookup};

// Resolves which action a row-click slot activates, purely from the resource action schema -
// no rendered button required. A configured descriptor is resolved like any other (inline `action`,
// its `reference`, or by name), with descriptor overrides merged in; when it cannot be resolved -
// or its referenced schema is still loading - the slot does nothing: an explicit descriptor expresses
// intent and is never silently replaced. Only the FE default gesture (no descriptor) falls back to
// the `show` view, then `edit`. Returns undefined when nothing matches.
export const resolveRowAction = (
  actions: ResourceActionSchema[] | undefined,
  descriptor?: ActionDescriptor,
  {resource, recordId, schemas}: RowContext = {}
): RowAction | undefined => {
  if (descriptor) {
    const resolution = resolveActionDescriptor(
      descriptor,
      {actions: actions ?? [], resource, recordId},
      schemas
    );
    return resolution.status === 'resolved'
      ? {schema: resolution.schema, actionContext: resolution.actionContext}
      : undefined;
  }
  const schemaMap = generateActionSchemaMap(actions ?? []);
  const schema = schemaMap['show'] ?? schemaMap['edit'];
  return schema && {schema};
};
