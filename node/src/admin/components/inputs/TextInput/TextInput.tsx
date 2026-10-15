import React from 'react';
import {TextInput as RaTextInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {InputAdornment} from '@mui/material';

export type TextInputProps = InputProps & {
  multiline?: boolean;
  type?: string;
  prefix?: string;
  postfix?: string;
};

export const TextInput = ({prefix, postfix, ...rest}: TextInputProps) => {
  return (
    <RaTextInput
      {...rest}
      slotProps={{
        input: {
          startAdornment: prefix && <InputAdornment position="start">{prefix}</InputAdornment>,
          endAdornment: postfix && <InputAdornment position="end">{postfix}</InputAdornment>,
        },
      }}
    />
  );
};
