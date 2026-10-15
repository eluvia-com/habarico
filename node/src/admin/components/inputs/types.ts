import {ReactElement} from 'react';
import {Validator} from 'react-admin';
import type {SxProps, Theme} from '@mui/material/styles';

export type InputProps = {
  source: string;
  label?: string | ReactElement | false;
  helperText?: string | ReactElement | false;
  validate?: Validator | Validator[];
  size?: 'small' | 'medium';
  isRequired?: boolean;
  fullWidth?: boolean;
  alwaysOn?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
  // Every input binds through React Admin's `useInput` and should honour both flags, so they belong
  // on the shared surface rather than being re-declared per input.
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: string | boolean | number;
  placeholder?: string;
};
