import React from 'react';
import {useRecordContext, useTranslate} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {SchemaViewButton, SchemaViewButtonProps} from '../SchemaViewButton';

export type SchemaEditButtonProps = Omit<SchemaViewButtonProps, 'viewType' | 'viewName'> & {
  viewName?: string;
};

export const SchemaEditButton = (props: SchemaEditButtonProps) => {
  const translate = useTranslate();
  const resource = useResourceContext();
  const record = useRecordContext();
  const buttonReference = useResourceContext(props.reference);

  const {
    label = translate('ra.action.edit'),
    recordPk = resource === buttonReference ? record?.id : undefined,
    reference = buttonReference,
    viewName = 'edit',
    ...rest
  } = props;

  return (
    <SchemaViewButton
      viewType={'edit'}
      viewName={viewName}
      label={label}
      recordPk={recordPk}
      reference={reference}
      {...rest}
    />
  );
};
