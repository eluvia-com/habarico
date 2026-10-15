import {ReactElement} from 'react';
import {RaRecord} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {FieldSchema} from '@schema/types';

export type SchemaInputProps = Omit<InputProps, 'source'> & {
  source?: string;
  schema: FieldSchema;
  showLabel?: boolean;
  record?: RaRecord;
  // `disabled` / `readOnly` are inherited from `InputProps`.
  onChange?: () => void;
  hiddenEl?: ReactElement;
};
