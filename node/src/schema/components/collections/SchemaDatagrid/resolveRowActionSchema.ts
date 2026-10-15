import {ActionDescriptor, ActionSchema, ResourceActionSchema} from '@schema/types';
import {generateActionSchema, generateActionSchemaMap} from '@schema/utils/api';

// Resolves which action a row-click slot activates, purely from the resource action schema -
// no rendered button required. A configured descriptor is resolved to its action schema (inline
// `action` or by name), with descriptor overrides merged in; when it cannot be resolved the slot
// does nothing - an explicit descriptor expresses intent and is never silently replaced. Only the
// FE default gesture (no descriptor) falls back to the `show` view, then `edit`. Returns undefined
// when nothing matches, so activation is a no-op instead of throwing.
export const resolveRowActionSchema = (
  actions: ResourceActionSchema[] | undefined,
  descriptor?: ActionDescriptor
): ActionSchema | undefined => {
  const schemaMap = generateActionSchemaMap(actions ?? []);
  if (descriptor) {
    const base = descriptor.action ?? schemaMap[descriptor.name];
    return base ? generateActionSchema(base, descriptor) : undefined;
  }
  return schemaMap['show'] ?? schemaMap['edit'];
};
