import React from 'react';
import {TopToolbar} from 'react-admin';
import {DatagridActions} from '@admin/components/datagrid/DatagridActions';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {Stack} from '@mui/material';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {ActionDescriptor} from '@schema/types';
import {generateDescriptorsFromSchema} from '@schema/utils/generateDescriptorsFromSchema';

type ActionsProps = {
  descriptors?: ActionDescriptor[];
  target?: string;
};

export const SchemaListBoxActions = ({descriptors, target}: ActionsProps) => {
  const {columnSelector = false} = useAdminConfig();
  const {actions} = useLocalResourceSchemaContext();
  // Fall back to the referenced resource's collection actions (create / export / bulk — `!is_detail`)
  // when the box schema does not define `listActions`. An explicit `[]` means "no toolbar actions" and
  // is respected (only `undefined`/absent triggers the fallback).
  const recordDescriptors =
    descriptors ?? generateDescriptorsFromSchema(actions ?? [], true, 'list');
  const hasActions = recordDescriptors.length > 0;
  return (
    <TopToolbar sx={{alignItems: 'center'}}>
      {/* Reuse the standalone datagrid config actions (column / sort / config resets, filter, saved
          queries), but compact (`small`) for the embedded box toolbar. */}
      <DatagridActions columnSelector={columnSelector} size="small" />
      {hasActions && (
        <Stack ml={1} spacing={0.5} direction="row">
          <SchemaButtons
            color="inherit"
            surface="button"
            variant="outlined"
            iconOnly
            size="small"
            descriptors={recordDescriptors}
            target={target}
          />
        </Stack>
      )}
    </TopToolbar>
  );
};
