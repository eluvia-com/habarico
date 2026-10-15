import React from 'react';
import {FieldTitle, InputHelperText, useInput} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {Checkbox, FormControlLabel, FormHelperText} from '@mui/material';

export type CheckboxInputProps = InputProps;

export const CheckboxInput = (props: CheckboxInputProps) => {
  const {
    className,
    defaultValue = false,
    disabled,
    helperText,
    label,
    readOnly,
    size,
    source,
    sx,
    validate,
  } = props;

  const {
    field,
    fieldState: {error, invalid},
    isRequired,
  } = useInput({source, defaultValue, validate, disabled, readOnly});

  return (
    <span className={className}>
      <FormControlLabel
        label={
          label !== false && label !== '' ? (
            <FieldTitle label={label} source={source} isRequired={isRequired} />
          ) : undefined
        }
        disabled={disabled || readOnly}
        sx={sx}
        control={
          <Checkbox
            {...field}
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            size={size}
            inputProps={{'aria-invalid': invalid}}
          />
        }
      />
      {(helperText !== false || invalid) && (
        <FormHelperText error={invalid} component="span" sx={{display: 'block', mx: '14px'}}>
          <InputHelperText error={error?.message} helperText={helperText} />
        </FormHelperText>
      )}
    </span>
  );
};
