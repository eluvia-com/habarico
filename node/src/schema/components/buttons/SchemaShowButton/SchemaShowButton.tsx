import React from 'react';
import {useRecordContext, useTranslate} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {SchemaViewButton, SchemaViewButtonProps} from '../SchemaViewButton';

export type SchemaShowButtonProps = Omit<SchemaViewButtonProps, 'viewType' | 'viewName'> & {
  viewName?: string;
};

export const SchemaShowButton = (props: SchemaShowButtonProps) => {
  const translate = useTranslate();
  const resource = useResourceContext();
  const record = useRecordContext();
  const buttonReference = useResourceContext(props.reference);

  const {
    label = translate('ra.action.show'),
    recordPk = resource === buttonReference ? record?.id : undefined,
    reference = buttonReference,
    viewName = 'show',
    ...rest
  } = props;

  return (
    <SchemaViewButton
      viewType={'show'}
      viewName={viewName}
      label={label}
      recordPk={recordPk}
      reference={reference}
      {...rest}
    />
  );
};
