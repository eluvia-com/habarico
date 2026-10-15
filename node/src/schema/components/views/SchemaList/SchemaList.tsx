import React, {ReactNode} from 'react';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {ViewSchemaProvider} from '@schema/contexts/ViewSchemaContext';
import {useGetTargetValues} from '@schema/hooks/useGetTargetValues';
import {ListContent} from './ListContent';

export type SchemaListProps = {
  name?: string;
  children?: ReactNode;
  datagridButtons?: ReactNode;
  title?: ReactNode;
  toolbarActions?: ReactNode;
  listActions?: ReactNode;
};

export const SchemaList = ({
  name = 'list',
  datagridButtons,
  title,
  toolbarActions,
  listActions,
  children = (
    <ListContent
      datagridButtons={datagridButtons}
      title={title}
      toolbarActions={toolbarActions}
      listActions={listActions}
    />
  ),
}: SchemaListProps) => {
  const {resource} = useSchemaViewRouterContext();
  const targetValues = useGetTargetValues();

  const schemaParams = {
    ...(targetValues ? {_target: JSON.stringify(targetValues)} : {}),
  };

  return (
    <LocalResourceSchemaProvider resource={resource} params={schemaParams}>
      <ViewSchemaProvider name={name}>{children}</ViewSchemaProvider>
    </LocalResourceSchemaProvider>
  );
};
