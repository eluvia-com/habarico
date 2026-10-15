import React, {useState} from 'react';
import {FieldTitle, InputHelperText, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {alpha} from '@mui/material';
import {styled, useThemeProps} from '@mui/material/styles';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import {PickerValue} from '@mui/x-date-pickers/internals';

export type DateTimeInputProps = InputProps & {
  minDate?: Date;
  maxDate?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
  shouldDisableDate?: (date: Date) => boolean;
};

export const DateTimeInput = (props: DateTimeInputProps) => {
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
      field.onChange(value.toISOString());
    }
  };

  return (
    <StyledDateTimePicker
      className={className}
      value={field.value}
      label={
        label !== '' && label !== false ? (
          <FieldTitle label={label} source={source} isRequired={isRequired} />
        ) : null
      }
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
          ) : null,
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

const PREFIX = 'RaDateTimeInput';

const defaultFormat = (value: string | Date | number) => {
  if (!value) {
    return null;
  }
  return new Date(value);
};

const StyledDateTimePicker = styled(DateTimePicker, {
  name: PREFIX,
  overridesResolver: (props, styles) => styles.root,
})({
  marginTop: 0,
});
