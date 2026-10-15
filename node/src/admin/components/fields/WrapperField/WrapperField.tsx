import React, {ReactNode} from 'react';
import {WrapperField as RaWrapperField} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';

export type WrapperFieldProps = FieldProps & {
  fixed?: boolean;
  children?: ReactNode;
};

export const WrapperField = ({source, label, sortable, children}: WrapperFieldProps) => {
  return (
    <RaWrapperField label={label} source={source} sortable={sortable}>
      {children}
    </RaWrapperField>
  );
};
