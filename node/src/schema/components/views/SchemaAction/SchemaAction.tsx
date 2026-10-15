import React, {ReactNode} from 'react';
import {CreateProps} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {useRecordIdOrUndefined} from '@admin/hooks/useRecordIdOrUndefined';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {ViewSchemaProvider} from '@schema/contexts/ViewSchemaContext';
import {ActionContent} from './ActionContent';

export type SchemaActionProps = Omit<CreateProps, 'children'> & {
  name?: string;
  actionName?: string;
  children?: ReactNode;
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  params?: Record<string, string>;
};

export const SchemaAction = ({name = 'action', actionName, ...props}: SchemaActionProps) => {
  const {id, resource} = useSchemaViewRouterContext();
  const recordId = useRecordIdOrUndefined(id);

  const {children = <ActionContent {...props} />} = props;

  return (
    <LocalResourceSchemaProvider recordId={recordId} resource={resource} actionName={actionName}>
      <ViewSchemaProvider name={name}>{children}</ViewSchemaProvider>
    </LocalResourceSchemaProvider>
  );
};
