import {ActionDescriptor, ResourceActionSchema} from '@schema/types';

/**
 * Which scope of actions to keep when auto-generating descriptors:
 * - `'detail'` — only record-scoped actions (`is_detail`, URL has a pk: show / edit / delete). These
 *   are the per-row buttons.
 * - `'list'` — only collection-scoped actions (`!is_detail`, URL has no pk: create / export / bulk).
 *   These are the datagrid toolbar buttons.
 * - `'all'` — no `is_detail` filter (both scopes).
 *
 * `is_detail` is the canonical record-vs-collection discriminator (see the OpenAPI `DetailType`), the
 * same split `useGetResourceRouterElement` uses to route detail vs list action views.
 */
export type DescriptorScope = 'detail' | 'list' | 'all';

export const generateDescriptorsFromSchema = (
  actions: ResourceActionSchema[],
  isList: boolean,
  scope: DescriptorScope,
  viewName?: string
): ActionDescriptor[] => {
  return actions
    .filter(
      (schema) => isList || schema.view?.name !== viewName || schema.view?.endpoint?.reference
    )
    .filter((schema) => schema.showInList || !isList)
    .filter((schema) => {
      if (scope === 'detail') return schema.isDetail;
      if (scope === 'list') return !schema.isDetail;
      return true;
    })
    .filter((schema) => schema.showInDetail || isList)
    .map((action) => {
      return {
        name: action.name,
        label: action.label,
        icon: action.icon,
      };
    });
};
