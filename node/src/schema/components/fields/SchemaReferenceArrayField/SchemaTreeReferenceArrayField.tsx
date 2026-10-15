import React from 'react';
import {LinearProgress} from 'react-admin';
import {TreeArrayField} from '@admin/components/fields/TreeArrayField';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useTreeChoices} from '@admin/hooks/useTreeChoices';
import {FieldSchema, ItemFieldSchema} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';

export type SchemaTreeReferenceArrayFieldProps = FieldProps & {
  items: ItemFieldSchema | FieldSchema;
};

/**
 * Schema wrapper for the read-only `tree-relation` display (detail view). Unlike the chip branch it
 * does NOT mount a React Admin `ReferenceArrayField`: it resolves the reference list once via
 * `useTreeChoices` and hands the flat `choices` to `TreeArrayField`, which reads the selected ids
 * straight from the ambient record. The hook runs unconditionally (this component is only mounted for
 * the tree branch); loading renders a spinner.
 */
export const SchemaTreeReferenceArrayField = ({
  source,
  label,
  items,
}: SchemaTreeReferenceArrayFieldProps) => {
  const reference = useResourceContext(items.reference);

  const {choices, isLoading} = useTreeChoices(reference, {
    parent: items.options?.relation?.parent,
    sort: convertApiSortToRaSort(items.options?.relation?.sort),
  });

  if (isLoading) return <LinearProgress />;

  return <TreeArrayField source={source} label={label} choices={choices} />;
};
