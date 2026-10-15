import {cs, de, enGB, es, fr, it, ja, nl, pl, pt, ro, sk, uk} from 'date-fns/locale';
import React from 'react';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';

const LOCALES = {en: enGB, cs, de, sk, es, fr, it, pl, uk, nl, pt, ro, ja};

export type LocaleProviderProps = {
  children: React.ReactNode;
  locale?: string;
};

export const LocaleProvider = ({children, locale = 'en'}: LocaleProviderProps) => {
  const langCode = locale.split('-')[0];

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={
        langCode in LOCALES ? LOCALES[langCode as keyof typeof LOCALES] : LOCALES['en']
      }
    >
      {children}
    </LocalizationProvider>
  );
};
