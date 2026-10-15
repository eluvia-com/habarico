import {ReactElement} from 'react';
import {RaRecord} from 'react-admin';
import type {SxProps, Theme} from '@mui/material/styles';

export type FieldProps = {
  source: string;
  label?: string | ReactElement | false;
  textLabel?: string;
  shortLabel?: string | ReactElement | false;
  showLabel?: boolean;
  sortable?: boolean;
  sortBy?: string;
  record?: RaRecord;
  isRequired?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  emptyText?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  // Return type is `any` deliberately: this prop is spread into several React Admin
  // field components whose `transform` expects different return types (e.g. DateField
  // wants `Date`), and a narrower shared type is not assignable to all of them.
  transform?: (value: unknown) => any;
};
