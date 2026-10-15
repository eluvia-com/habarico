import React from 'react';
import {DatagridActions} from '@admin/components/datagrid/DatagridActions';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

export const SchemaListActions = () => {
  const {columnSelector = false} = useAdminConfig();
  const {viewSchema} = useViewSchemaContext();
  const listActions = viewSchema.list?.listActions;
  return (
    <>
      <DatagridActions columnSelector={columnSelector} />
      {listActions && listActions.length > 0 && (
        <SchemaButtons
          descriptors={listActions}
          isList
          viewName={viewSchema.name}
          showLabel={false}
        />
      )}
    </>
  );
};
