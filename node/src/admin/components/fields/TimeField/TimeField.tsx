import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, RaRecord, useLocaleState} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';

export type TimeFieldProps = FieldProps & {locales?: string};

export const TimeField = ({source, locales, sx = {}}: TimeFieldProps) => {
  const [locale] = useLocaleState();

  const format = (record: RaRecord) => {
    const value = get(record, source);
    if (!value) return '';
    if (typeof value !== 'string') return String(value);
    const parts = value.split(':');
    const date = new Date();
    date.setHours(Number(parts[0]) || 0);
    date.setMinutes(Number(parts[1]) || 0);
    date.setSeconds(Number(parts[2]) || 0);
    date.setMilliseconds(0);
    return new Intl.DateTimeFormat(locales || locale, {
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <FunctionField
      source={source}
      render={(record: RaRecord) => format(record)}
      sx={{whiteSpace: 'nowrap', ...sx}}
    />
  );
};
