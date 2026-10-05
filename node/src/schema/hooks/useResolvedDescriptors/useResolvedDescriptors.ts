import {useMemo} from 'react';
import {useResourceContext as useRaResourceContext} from 'react-admin';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {useGetLocalResourceSchemas} from '@schema/hooks/useGetLocalResourceSchemas';
import {useHabRecordContext} from '@schema/hooks/useHabRecordContext';
import {ActionDescriptor, ActionSchema, AnyActionDescriptor, HabRecord} from '@schema/types';
import {
  ActionContext,
  LocalActions,
  collectDescriptorReferences,
  expandDefaultActions,
  resolveActionDescriptor,
} from '@schema/utils/actionDescriptor';

/** A descriptor with the action it renders and what that action runs against. */
export type ResolvedDescriptor = {
  descriptor: ActionDescriptor;
  schema: ActionSchema;
  actionContext?: ActionContext;
};

// Stable identity for an unset slot, so a caller passing nothing does not invalidate the memos below
// on every render.
const NO_DESCRIPTORS: AnyActionDescriptor[] = [];

type UseActionDescriptorsProps = {
  // the slot to resolve; absent or empty resolves to nothing
  descriptors?: AnyActionDescriptor[];
  // overrides the record taken from the context
  record?: HabRecord;
  // a list surface keeps `showInList` defaults, a detail one `showInDetail`
  isList?: boolean;
  // the view the descriptors belong to — a default action opening it is left out
  viewName?: string;
};

/**
 * Resolves a list of action descriptors against the surrounding record's (or else the local schema's) actions and
 * the schemas its references load: `resolvedDescriptors` lists the buttons it renders, a `DefaultActions` entry
 * expanded and anything still loading or unknown left out.
 */
export const useResolvedDescriptors = ({
  descriptors = NO_DESCRIPTORS,
  record,
  isList = false,
  viewName,
}: UseActionDescriptorsProps) => {
  const contextRecord = useHabRecordContext();
  const {schema} = useLocalResourceSchemaContext();
  const resource = useRaResourceContext();
  const references = useMemo(() => collectDescriptorReferences(descriptors), [descriptors]);
  const schemas = useGetLocalResourceSchemas({references});

  const effectiveRecord = record ?? contextRecord;
  const actions = effectiveRecord ? effectiveRecord.meta.schema.actions : schema.actions;
  const recordId = effectiveRecord?.id;

  const local = useMemo<LocalActions>(
    () => ({actions: actions ?? [], resource, recordId}),
    [actions, resource, recordId]
  );

  const resolvedDescriptors = useMemo(
    () =>
      expandDefaultActions(descriptors, local, schemas, {isList, viewName}).flatMap(
        (descriptor): ResolvedDescriptor[] => {
          const result = resolveActionDescriptor(descriptor, local, schemas);
          return result.status === 'resolved'
            ? [{descriptor, schema: result.schema, actionContext: result.actionContext}]
            : [];
        }
      ),
    [descriptors, local, schemas, isList, viewName]
  );

  return {record: effectiveRecord, actions, resolvedDescriptors};
};
