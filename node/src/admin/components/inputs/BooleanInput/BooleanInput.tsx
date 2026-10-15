import React from 'react';
import {BooleanInput as RaBooleanInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';

export type BooleanInputProps = InputProps;

export const BooleanInput = ({sx = {}, ...rest}: BooleanInputProps) => {
  return (
    <RaBooleanInput
      {...rest}
      sx={{
        ...sx,
        margin: '9px 0 8px 16px', // Keep the same height and margin like other input fields
      }}
    />
  );
};
