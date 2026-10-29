import React from 'react';
import {describe, expect, it} from 'vitest';
import {createDarkTheme, createLightTheme} from '@design/theme';
import {TextField, ThemeProvider} from '@mui/material';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {render} from '@testing-library/react';

const borderOf = (selector: string) => {
  const outline = document.querySelector(selector);
  if (!outline) throw new Error(`${selector} not rendered`);
  return getComputedStyle(outline).borderColor;
};

describe.each([
  ['light', createLightTheme],
  ['dark', createDarkTheme],
])('input borders in the %s theme', (_mode, createTheme) => {
  it.each([false, true])('draw a date picker like a text field (disabled: %s)', (disabled) => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <TextField label={'Name'} disabled={disabled} />
          <DatePicker label={'Release date'} disabled={disabled} />
        </LocalizationProvider>
      </ThemeProvider>
    );

    const textFieldBorder = borderOf('.MuiOutlinedInput-notchedOutline');
    expect(textFieldBorder).not.toBe('');
    expect(borderOf('.MuiPickersOutlinedInput-notchedOutline')).toBe(textFieldBorder);
  });
});
