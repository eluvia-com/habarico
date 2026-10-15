import React, {useCallback, useMemo, useState} from 'react';
import {TextInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {parseLocaleNumber} from '@foundation/utils/locale';
import {InputAdornment} from '@mui/material';

export type NumberInputProps = InputProps & {
  locales?: string;
  /** Standard `Intl.NumberFormatOptions` — the schema layer maps its `numberFormat` option here. */
  numberFormat?: Intl.NumberFormatOptions;
  prefix?: string;
  postfix?: string;
};

export const NumberInput = ({
  locales,
  numberFormat,
  prefix,
  postfix,
  source,
  ...rest
}: NumberInputProps) => {
  // Get the current locale from the locales prop or navigator
  const currentLocale = locales || navigator.language;

  // Component state to manage input focus
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  // Default fraction digits when used standalone (no `numberFormat`); the schema wrapper always
  // supplies its own integer/decimal defaults.
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    style,
    currency,
    unit,
  } = numberFormat || {};

  // --------------------------------------------------------------------------
  // Evaluate prefix/postfix values
  // --------------------------------------------------------------------------

  const {prefixValue, postfixValue} = useMemo(() => {
    const formatToParts = Intl.NumberFormat(currentLocale, {style, currency, unit}).formatToParts(
      0
    );

    const prefixParts = [
      formatToParts[0].type === 'currency' ? formatToParts[0].value : undefined,
      prefix,
    ];
    const postfixParts = [
      ['currency', 'unit'].includes(formatToParts[formatToParts.length - 1].type)
        ? formatToParts[formatToParts.length - 1].value
        : undefined,
      postfix,
    ];

    return {
      prefixValue: prefix || prefixParts.filter((part) => part).join('\u00A0'),
      postfixValue: postfix || postfixParts.filter((part) => part).join('\u00A0'),
    };
  }, [currentLocale, style, currency, unit, prefix, postfix]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Function to parse the input value to form data
  const parse = useCallback(
    (value: string | number) => {
      if (value === '') return null;
      const parsedValues = parseLocaleNumber(value.toString(), currentLocale);
      if (parsedValues.isNan) return null;
      if (parsedValues.lastDecimalSeparator && maximumFractionDigits > 0) return value;
      if (parsedValues.decimalPlaces > maximumFractionDigits) {
        const [intPart, decPart] = parsedValues.string.split('.');
        if (maximumFractionDigits === 0) return intPart;
        return intPart + '.' + decPart.slice(0, maximumFractionDigits);
      }
      return parsedValues.string;
    },
    [currentLocale, maximumFractionDigits]
  );

  // Function to format the value for display
  const format = useCallback(
    (value: string | number) => {
      if (value === null || value === '' || value === undefined) {
        return '';
      }
      const parsedValue = parseLocaleNumber(value, currentLocale);

      if (parsedValue.isNan) {
        return '';
      }

      // Add final decimal point on blur or when the value is initialized
      const numberFormatOptions = {
        maximumFractionDigits,
        ...(hasFocus && typeof value !== 'number'
          ? {
              minimumFractionDigits: Math.min(parsedValue.decimalPlaces, maximumFractionDigits),
              // Disable grouping for better performance and consistency
              useGrouping: false,
            }
          : {
              minimumFractionDigits: Math.min(
                Math.max(parsedValue.decimalPlaces, minimumFractionDigits),
                maximumFractionDigits
              ),
            }),
        roundingMode: 'trunc',
      };

      const result = Intl.NumberFormat(
        currentLocale,
        numberFormatOptions as Intl.NumberFormatOptions
      ).format(parsedValue.number);

      // Append the last decimal separator if user input ends with it
      if (parsedValue.lastDecimalSeparator && numberFormatOptions.minimumFractionDigits === 0) {
        return result + parsedValue.lastDecimalSeparator;
      } else return result;
    },
    [currentLocale, hasFocus, maximumFractionDigits, minimumFractionDigits]
  );

  return (
    <TextInput
      source={source}
      fullWidth
      {...rest}
      parse={parse}
      format={format}
      onFocus={() => {
        setHasFocus(true);
      }}
      onBlur={() => {
        setHasFocus(false);
      }}
      slotProps={{
        input: {
          startAdornment: prefixValue && (
            <InputAdornment position="start">{prefixValue}</InputAdornment>
          ),
          endAdornment: postfixValue && (
            <InputAdornment position="end">{postfixValue}</InputAdornment>
          ),
        },
      }}
    />
  );
};
