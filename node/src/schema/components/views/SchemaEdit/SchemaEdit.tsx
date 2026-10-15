import React, {ReactNode} from 'react';
import {EditProps, useGetRecordId} from 'react-admin';
import {FieldValues, SubmitHandler} from 'react-hook-form';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {ViewSchemaProvider} from '@schema/contexts/ViewSchemaContext';
import {EditContent} from './EditContent';

export type SchemaEditProps = Omit<EditProps, 'children'> & {
  name?: string;
  children?: ReactNode;
  onSubmit?: SubmitHandler<FieldValues>;
  onPostSubmit?: () => void;
  title?: ReactNode;
  toolbarActions?: ReactNode;
  formActions?: ReactNode;
};

export const SchemaEdit = ({name = 'edit', ...props}: SchemaEditProps) => {
  const {id, resource} = useSchemaViewRouterContext();
  const {presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  const recordId = useGetRecordId(id);

  const {
    children = <EditContent {...props} id={recordId} redirect={isInOverlay ? false : undefined} />,
  } = props;
  return (
    <LocalResourceSchemaProvider recordId={recordId} resource={resource}>
      <ViewSchemaProvider name={name}>{children}</ViewSchemaProvider>
    </LocalResourceSchemaProvider>
  );
};
