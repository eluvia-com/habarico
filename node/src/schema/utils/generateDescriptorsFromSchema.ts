import {ActionDescriptor, ActionScopeType, ResourceActionSchema} from '@schema/types';

/**
 * Which scope of actions to keep: `'detail'` the record-scoped ones (`is_detail`, URL has a pk: the
 * per-row buttons), `'list'` the collection-scoped ones (create / export / bulk), `'all'` both.
 */
export type DescriptorScope = ActionScopeType;

/** The fields the filters read, so a service schema's actions qualify as well as a resource's. */
export type DescriptorSource = Pick<
  ResourceActionSchema,
  'name' | 'label' | 'icon' | 'showInList' | 'showInDetail' | 'isDetail' | 'view'
>;

export const generateDescriptorsFromSchema = (
  actions: DescriptorSource[],
  isList: boolean,
  scope: DescriptorScope,
  viewName?: string
): ActionDescriptor[] => {
  return (
    actions
      // on a detail, an action opening the very view it sits in is left out
      .filter(
        (schema) => isList || !viewName || schema.view?.name !== viewName || !!schema.view?.endpoint
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
      })
  );
};
