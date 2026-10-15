import React from 'react';
import {InputProps, TopToolbar} from 'react-admin';
import {FilterDrawerButton} from '@admin/components/buttons/FilterDrawerButton';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {ActionDescriptor} from '@schema/types';
import {generateDescriptorsFromSchema} from '@schema/utils/generateDescriptorsFromSchema';

type ActionsProps = {
  descriptors?: ActionDescriptor[];
  target?: string;
  filters?: React.ReactElement<InputProps>[];
};

export const SchemaImagesBoxActions = ({filters = [], descriptors, target}: ActionsProps) => {
  const {actions} = useLocalResourceSchemaContext();
  // Fall back to the referenced resource's collection actions (create / export / bulk — `!is_detail`)
  // when the box schema does not define `listActions`. An explicit `[]` means "no toolbar actions" and
  // is respected (only `undefined`/absent triggers the fallback).
  const recordDescriptors =
    descriptors ?? generateDescriptorsFromSchema(actions ?? [], true, 'list');
  const hasActions = recordDescriptors.length > 0;
  const hasFilters = filters.length > 0;

  // Nothing to put in the toolbar (no filters, no list actions) → render no toolbar at all, so it does
  // not take up space above the image grid.
  if (!hasFilters && !hasActions) return null;

  return (
    <TopToolbar sx={{justifyContent: 'flex-start'}}>
      {hasFilters && (
        <FilterDrawerButton filters={filters} size="small" color="inherit" showLabel={false} />
      )}
      {hasActions && (
        <SchemaButtons
          surface="button"
          variant="outlined"
          size="small"
          descriptors={recordDescriptors}
          target={target}
        />
      )}
    </TopToolbar>
  );
};
