import React from 'react';
import {DateField as RaDateField, useLocaleState} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';

export type DateFieldProps = FieldProps & {
  locales?: string;
  showTime?: boolean;
};

export const DateField = ({sx = {}, locales, ...rest}: DateFieldProps) => {
  const [locale] = useLocaleState();

  return <RaDateField {...rest} locales={locales || locale} sx={{whiteSpace: 'nowrap', ...sx}} />;
};
