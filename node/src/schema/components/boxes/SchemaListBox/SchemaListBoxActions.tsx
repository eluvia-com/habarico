import React from 'react';
import {TopToolbar} from 'react-admin';
import {DatagridActions} from '@admin/components/datagrid/DatagridActions';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {AnyActionDescriptor} from '@schema/types';

type ActionsProps = {
  descriptors?: AnyActionDescriptor[];
  target?: string;
};

export const SchemaListBoxActions = ({descriptors, target}: ActionsProps) => {
  const {columnSelector = false} = useAdminConfig();
  return (
    <TopToolbar sx={{alignItems: 'center', gap: 2}}>
      {/* Reuse the standalone datagrid config actions (column / sort / config resets, filter, saved
          queries), but compact (`small`) for the embedded box toolbar. */}
      <DatagridActions columnSelector={columnSelector} size="small" />
      <SchemaButtons
        color="inherit"
        surface="button"
        variant="outlined"
        iconOnly
        size="small"
        isList
        descriptors={descriptors}
        target={target}
      />
    </TopToolbar>
  );
};
