import React from 'react';
import {LinearProgress, useTranslate} from 'react-admin';
import {TreeArrayInput} from '@admin/components/inputs/TreeArrayInput';
import {InputProps} from '@admin/components/inputs/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useTreeChoices} from '@admin/hooks/useTreeChoices';
import {FieldSchema, ItemFieldSchema} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {resourceKey} from '@schema/utils/resourceReference';

export type SchemaTreeReferenceArrayInputProps = InputProps & {
  defaultValue?: unknown;
  items: ItemFieldSchema | FieldSchema;
};

/**
 * Schema wrapper for the multi-value `tree-relation` input. Unlike the autocomplete branch it does
 * NOT mount a React Admin `ReferenceArrayInput`: it resolves the whole reference list once via
 * `useTreeChoices` and hands the flat `choices` to `TreeArrayInput`, which binds the checked ids
 * through `useInput`. The hook runs unconditionally at the top level (this component is only mounted
 * for the tree branch), and loading renders a spinner.
 */
export const SchemaTreeReferenceArrayInput = ({
  source,
  label,
  items,
  ...rest
}: SchemaTreeReferenceArrayInputProps) => {
  const reference = useResourceContext(resourceKey(items.reference));
  const translate = useTranslate();

  const {choices, isLoading} = useTreeChoices(reference, {
    parent: items.options?.relation?.parent,
    sort: convertApiSortToRaSort(items.options?.relation?.sort),
  });

  if (isLoading) return <LinearProgress />;

  return (
    <TreeArrayInput
      source={source}
      label={label}
      choices={choices}
      {...rest}
      helperText={translate('ra.input.tree_array_input.help')}
    />
  );
};
