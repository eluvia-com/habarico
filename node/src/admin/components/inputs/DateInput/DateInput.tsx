import React, {useState} from 'react';
import {FieldTitle, InputHelperText, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {alpha} from '@mui/material';
import {styled, useThemeProps} from '@mui/material/styles';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {PickerValue} from '@mui/x-date-pickers/internals';

export type DateInputProps = InputProps & {
  minDate?: Date;
  maxDate?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
  shouldDisableDate?: (date: Date) => boolean;
};

export const DateInput = (props: DateInputProps) => {
  const {
    className,
    sx,
    defaultValue,
    label,
    source,
    helperText,
    validate,
    disabled,
    readOnly,
    minDate,
    maxDate,
    disableFuture,
    disablePast,
    shouldDisableDate,
  } = useThemeProps({
    props: props,
    name: PREFIX,
  });

  const {field, fieldState, isRequired} = useInput({
    defaultValue,
    source,
    validate,
    disabled,
    readOnly,
    format: defaultFormat,
  });

  const [open, setOpen] = useState(false);
  const {error, invalid} = fieldState;
  const renderHelperText = helperText !== false || invalid;

  const handleChange = (value: PickerValue | null) => {
    if (value === null) {
      field.onChange(null);
    } else {
      const dateValue = new Date(value.getTime() - value.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      field.onChange(dateValue);
    }
  };

  const datepickerLabel =
    label !== '' && label !== false ? (
      <FieldTitle label={label} source={source} isRequired={isRequired} />
    ) : undefined;

  return (
    <StyledDatePicker
      value={field.value}
      className={className}
      label={datepickerLabel}
      disabled={disabled}
      readOnly={readOnly}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      slotProps={{
        textField: {
          onClick: disabled || readOnly ? undefined : () => setOpen(true),
          helperText: renderHelperText ? (
            <InputHelperText error={error?.message} helperText={helperText} />
          ) : (
            false
          ),
          label: datepickerLabel,
          error: invalid,
          fullWidth: true,
          size: 'small',
          // The caller's own `sx` last, so it wins over these defaults. Array form, because
          // `SxProps` may be an array or a theme callback just as legally as a plain object.
          sx: [
            (theme) => ({
              '& .MuiPickersInputBase-root': {
                backgroundColor: alpha(theme.palette.background.paper, 0.2),
              },
              '& .MuiPickersSectionList-root': {
                width: 0,
              },
            }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ],
        },
      }}
      onChange={handleChange}
      minDate={minDate}
      maxDate={maxDate}
      disableFuture={disableFuture}
      disablePast={disablePast}
      shouldDisableDate={shouldDisableDate}
    />
  );
};

const PREFIX = 'RaDateInput';

const defaultFormat = (value: string | Date | number) => {
  if (!value) {
    return null;
  }
  return new Date(value);
};

const StyledDatePicker = styled(DatePicker, {
  name: PREFIX,
  overridesResolver: (props, styles) => styles.root,
})({
  marginTop: 0,
});
