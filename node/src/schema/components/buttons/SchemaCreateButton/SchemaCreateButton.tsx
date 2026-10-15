import React from 'react';
import {useTranslate} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {SchemaViewButton, SchemaViewButtonProps} from '../SchemaViewButton';

export type SchemaCreateButtonProps = Omit<
  SchemaViewButtonProps,
  'viewType' | 'viewName' | 'recordPk'
> & {
  viewName?: string;
};

export const SchemaCreateButton = (props: SchemaCreateButtonProps) => {
  const translate = useTranslate();
  const buttonReference = useResourceContext(props.reference);
  const {
    label = translate('ra.action.create'),
    reference = buttonReference,
    viewName = 'create',
    ...rest
  } = props;
  return (
    <SchemaViewButton
      viewType={'create'}
      viewName={viewName}
      label={label}
      reference={reference}
      {...rest}
    />
  );
};
