import React, {ReactElement} from 'react';
import {InputProps, TopToolbar} from 'react-admin';
import {FilterDrawerButton} from '@admin/components/buttons/FilterDrawerButton';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useResolvedDescriptors} from '@schema/hooks/useResolvedDescriptors';
import {AnyActionDescriptor} from '@schema/types';

type ActionsProps = {
  descriptors?: AnyActionDescriptor[];
  target?: string;
  filters?: ReactElement<InputProps>[];
};

export const SchemaImagesBoxActions = ({filters, descriptors, target}: ActionsProps) => {
  const hasActions =
    useResolvedDescriptors({descriptors, isList: true}).resolvedDescriptors.length > 0;

  // Nothing to put in the toolbar (no filters, no list actions) → render no toolbar at all, so it does
  // not take up space above the image grid.
  if (!filters?.length && !hasActions) return null;

  return (
    <TopToolbar sx={{justifyContent: 'flex-start'}}>
      {filters?.length ? (
        <FilterDrawerButton filters={filters} size="small" color="inherit" showLabel={false} />
      ) : null}
      {hasActions && (
        <SchemaButtons
          surface="button"
          variant="outlined"
          size="small"
          isList
          descriptors={descriptors}
          target={target}
        />
      )}
    </TopToolbar>
  );
};
