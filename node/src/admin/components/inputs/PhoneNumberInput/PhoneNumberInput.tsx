import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {FieldTitle, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {FlagIcon} from '@design/atoms/FlagIcon';
import {
  getCountryCode,
  getCountryFormat,
  getCountryFormats,
  parsePhoneNumber,
} from '@foundation/utils/localflavor/phone';
import {InputAdornment, MenuItem, Select, TextField} from '@mui/material';

const countDigitsBefore = (value: string, upTo: number): number => {
  let count = 0;
  for (let i = 0; i < upTo; i++) {
    if (/\d/.test(value[i])) count++;
  }
  return count;
};

const findBackspacePos = (value: string, selStart: number): number => {
  let pos = selStart - 1;
  while (pos > 0 && !/\d/.test(value[pos - 1])) pos--;
  return pos;
};

const findDeletePos = (value: string, selStart: number): number => {
  let pos = selStart;
  while (pos < value.length && !/\d/.test(value[pos])) pos++;
  return pos;
};

export type PhoneNumberInputProps = InputProps & {
  defaultRegion?: string;
  allowedRegions?: string[];
};

export const PhoneNumberInput = ({
  source,
  defaultRegion,
  allowedRegions,
  label,
  helperText,
  validate,
  isRequired,
  fullWidth = true,
  size,
  sx,
  defaultValue,
  placeholder,
}: PhoneNumberInputProps) => {
  const {
    field,
    fieldState: {error, isTouched},
    formState: {isSubmitted},
    isRequired: formIsRequired,
    id,
  } = useInput({source, validate, defaultValue});

  const countries = getCountryFormats(allowedRegions);
  const resolvedDefaultRegion = defaultRegion || countries[0].region;

  // Get the country code from the value  // Store the selected country code in state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    getCountryCode(field.value?.toString() || '', resolvedDefaultRegion)
  );

  // Get the selected country object
  const selectedCountry = getCountryFormat(selectedCountryCode);

  // Change the country code and update the value
  const changeCountryCode = (code: string) => {
    setSelectedCountryCode(code);
    if (parsedValue.length === 0) {
      field.onChange(null);
    } else {
      field.onChange(`${code}${parsedValue}`);
    }
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  // Cursor position, counting only digits (skipping formatting spaces)
  const cursorRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  // Extract national digits (without country code) from stored value
  const parseNationalDigits = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return '';
      const parsed = parsePhoneNumber(value);
      if (parsed.startsWith(selectedCountryCode)) {
        return parsed.slice(selectedCountryCode.length).replace(/\D/g, '');
      }
      return '';
    },
    [selectedCountryCode]
  );

  // Parsed value without country code
  const parsedValue = parseNationalDigits(field.value);
  // Formatted value without country code
  const formattedValue = selectedCountry ? selectedCountry.format(parsedValue) : parsedValue;

  // Restore cursor position after DOM update
  useLayoutEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      const inputCurrentValue = inputRef.current.value;
      const targetDigitCount = cursorRef.current;

      let digitsSeen = 0;
      let pos = 0;
      for (pos = 0; pos < inputCurrentValue.length; pos++) {
        if (digitsSeen === targetDigitCount) break;
        if (/\d/.test(inputCurrentValue[pos])) digitsSeen++;
      }

      inputRef.current.setSelectionRange(pos, pos);
      cursorRef.current = null;
    }
  });

  const updateValue = useCallback(
    (newDigits: string, digitsBeforeCursor: number) => {
      cursorRef.current = digitsBeforeCursor;
      const newValue = newDigits.length === 0 ? null : `${selectedCountryCode}${newDigits}`;
      const currentValue = field.value ?? null;
      const valueChanged = newValue !== currentValue && !(newValue === null && !currentValue);
      if (valueChanged) {
        field.onChange(newValue);
      } else {
        // Value unchanged (e.g., typed a non-digit, or deleted a space).
        // Force re-render to restore the formatted display and cursor position.
        forceRender((n) => n + 1);
      }
    },
    [selectedCountryCode, field]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? 0;
    const parsedValue = inputValue.replace(/\D/g, '');

    // Count digits before cursor position
    let digitsBeforeCursor = 0;
    for (let i = 0; i < cursorPos && i < inputValue.length; i++) {
      if (/\d/.test(inputValue[i])) digitsBeforeCursor++;
    }

    updateValue(parsedValue, digitsBeforeCursor);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const value = input.value;

    if (selStart !== selEnd) return;

    // Backspace: if the character before cursor is a formatting char (space),
    // skip over it and delete the digit before the space instead.
    if (e.key === 'Backspace' && selStart > 0 && !/\d/.test(value[selStart - 1])) {
      e.preventDefault();
      const digitPos = findBackspacePos(value, selStart);
      if (digitPos > 0) {
        const beforeCursor = countDigitsBefore(value, digitPos - 1);
        updateValue(
          parsedValue.slice(0, beforeCursor) + parsedValue.slice(beforeCursor + 1),
          beforeCursor
        );
      }
      // Delete: if the character at cursor is a formatting char (space),
      // skip over it and delete the next digit instead.
    } else if (e.key === 'Delete' && selStart < value.length && !/\d/.test(value[selStart])) {
      e.preventDefault();
      const digitPos = findDeletePos(value, selStart);
      if (digitPos < value.length) {
        const beforeCursor = countDigitsBefore(value, digitPos);
        updateValue(
          parsedValue.slice(0, beforeCursor) + parsedValue.slice(beforeCursor + 1),
          beforeCursor
        );
      }
    }
  };

  const required = isRequired ?? formIsRequired;
  const hasError = !!((isTouched || isSubmitted) && error);

  return (
    <TextField
      id={id}
      name={field.name}
      value={formattedValue}
      onChange={handleChange}
      onBlur={field.onBlur}
      inputRef={(el: HTMLInputElement | null) => {
        inputRef.current = el;
        // Correctly connect react-hook-form
        if (typeof field.ref === 'function') {
          field.ref(el);
        }
      }}
      // `label={false}` / `label={''}` (bare mode — a PropertyItem owns the label) must omit the
      // label entirely, not wrap it in a `FieldTitle`: an always-present label node keeps MUI's
      // notched outline open, leaving a white legend gap over the border. Only render the title
      // when a label is set.
      label={
        label === false || label === '' ? undefined : (
          <FieldTitle source={source} label={label} isRequired={required} />
        )
      }
      placeholder={placeholder}
      error={hasError}
      // `undefined` (not a blank space) so MUI omits the helper row when there is no message,
      // giving the field the same dynamic height as the other inputs.
      helperText={hasError ? error?.message : helperText || undefined}
      size={size}
      fullWidth={fullWidth}
      sx={sx}
      slotProps={{
        htmlInput: {
          onKeyDown: handleKeyDown,
          inputMode: 'tel',
        },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{color: 'text.primary'}}>
              <Select
                value={selectedCountryCode}
                onChange={(e) => changeCountryCode(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{'& .MuiSelect-select': {display: 'flex', alignItems: 'center'}}}
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    <FlagIcon code={country.region} sx={{width: 20, height: 14}} />
                  </MenuItem>
                ))}
              </Select>
              <span style={{marginLeft: 4, whiteSpace: 'nowrap'}}>{selectedCountryCode}</span>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
