import React, {ReactNode} from 'react';
import {CreateProps} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {ViewSchemaProvider} from '@schema/contexts/ViewSchemaContext';
import {CreateContent} from './CreateContent';

export type SchemaCreateProps = Omit<CreateProps, 'children'> & {
  name?: string;
  children?: ReactNode;
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  params?: Record<string, string>;
  title?: ReactNode;
  toolbarActions?: ReactNode;
  formActions?: ReactNode;
};

export const SchemaCreate = ({name = 'create', ...props}: SchemaCreateProps) => {
  const {resource} = useSchemaViewRouterContext();

  const {children = <CreateContent {...props} />} = props;
  return (
    <LocalResourceSchemaProvider resource={resource}>
      <ViewSchemaProvider name={name}>{children}</ViewSchemaProvider>
    </LocalResourceSchemaProvider>
  );
};
