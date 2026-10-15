import React, {useMemo} from 'react';
import {ResourceContextProvider} from 'react-admin';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {ActionDescriptor, LocalResourceSchema} from '@schema/types';

type SchemaReferenceToolbarActionsProps = {
  reference: string;
  schema?: LocalResourceSchema;
  schemaParams?: Record<string, string>;
  resource: string;
  recordId: string | number;
  target?: string;
  descriptors?: ActionDescriptor[];
};

// Renders a list box's toolbar actions (bound to the referenced resource, e.g. its default
// "create") inside the box header. The box header sits outside the list's own provider tree,
// so we re-establish the reference resource context here: ResourceContextProvider so
// useHabRecordContext ignores the ambient parent record and SchemaButtons resolves actions
// against the reference resource, LocalResourceSchemaProvider for the action schemas, and
// ParentResourceDescriptorsProvider for the target/source linkage a nested create needs.
export const SchemaReferenceToolbarActions = ({
  reference,
  schema,
  schemaParams,
  resource,
  recordId,
  target,
  descriptors,
}: SchemaReferenceToolbarActionsProps) => {
  const parentDescriptors = useParentResourceDescriptorsContext();
  // Memoized: `ParentResourceDescriptorsProvider` doesn't memoize its own `value` — a fresh array on
  // every render would invalidate the context for `SchemaButtons` and everything it opens (a nested
  // create dialog) regardless of whether the descriptors changed. The `!target` branch already
  // returns `parentDescriptors` itself (stable), so only the `target` branch needed memoizing.
  const parentValue = useMemo(
    () => (target ? [...parentDescriptors, {resource, recordId, target}] : parentDescriptors),
    [target, parentDescriptors, resource, recordId]
  );

  return (
    <ResourceContextProvider value={reference}>
      <LocalResourceSchemaProvider resource={reference} params={schemaParams} schema={schema}>
        <ParentResourceDescriptorsProvider value={parentValue}>
          <SchemaButtons
            size="small"
            variant="contained"
            isList
            maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
            iconOnly="sm"
            descriptors={descriptors}
            target={target}
          />
        </ParentResourceDescriptorsProvider>
      </LocalResourceSchemaProvider>
    </ResourceContextProvider>
  );
};
