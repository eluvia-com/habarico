import React, {useState} from 'react';
import {FieldTitle, InputHelperText, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {alpha} from '@mui/material';
import {styled, useThemeProps} from '@mui/material/styles';
import {TimePicker} from '@mui/x-date-pickers/TimePicker';
import {PickerValue} from '@mui/x-date-pickers/internals';

export type TimeInputProps = InputProps;

export const TimeInput = (props: TimeInputProps) => {
  const {className, sx, defaultValue, label, source, helperText, validate, disabled, readOnly} =
    useThemeProps({
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
  const [initialDefaultValue] = useState(() => defaultFormat(field.value));
  const [open, setOpen] = useState(false);
  const {error, invalid} = fieldState;
  const renderHelperText = helperText !== false || invalid;

  const handleChange = (value: PickerValue | null) => {
    if (value === null) {
      field.onChange(null);
    } else {
      const h = String(value.getHours()).padStart(2, '0');
      const m = String(value.getMinutes()).padStart(2, '0');
      const s = String(value.getSeconds()).padStart(2, '0');
      field.onChange(`${h}:${m}:${s}`);
    }
  };

  return (
    <StyledTimePicker
      className={className}
      defaultValue={initialDefaultValue}
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
    />
  );
};

const PREFIX = 'RaTimeInput';

const defaultFormat = (value: string | Date | number) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  const parts = value.split(':');
  const date = new Date();
  date.setHours(Number(parts[0]) || 0);
  date.setMinutes(Number(parts[1]) || 0);
  date.setSeconds(Number(parts[2]) || 0);
  date.setMilliseconds(0);
  return date;
};

const StyledTimePicker = styled(TimePicker, {
  name: PREFIX,
  overridesResolver: (props, styles) => styles.root,
})({
  marginTop: 0,
});
