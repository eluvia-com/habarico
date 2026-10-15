import React, {ReactNode} from 'react';
import {useGetRecordId} from 'react-admin';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {ViewSchemaProvider} from '@schema/contexts/ViewSchemaContext';
import {ShowContent} from './ShowContent';

export type SchemaShowProps = {
  name?: string;
  children?: ReactNode;
  title?: ReactNode;
  toolbarActions?: ReactNode;
};

export const SchemaShow = ({name = 'show', ...props}: SchemaShowProps) => {
  const {id, resource} = useSchemaViewRouterContext();

  const recordId = useGetRecordId(id);
  const {
    children = (
      <ShowContent id={recordId} title={props.title} toolbarActions={props.toolbarActions} />
    ),
  } = props;

  return (
    <LocalResourceSchemaProvider recordId={recordId} resource={resource}>
      <ViewSchemaProvider name={name}>{children}</ViewSchemaProvider>
    </LocalResourceSchemaProvider>
  );
};
