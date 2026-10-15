import React, {useState} from 'react';
import {IconButton, InputAdornment, TextField, TextFieldProps} from '@mui/material';
import {Icon, IconType} from '../Icon';

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

export const PasswordField = (props: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  // `slotProps.input` may also be given as a function of the owner state; only the object form can
  // be read here, and that is the only form this component has ever merged.
  const inputSlotProps =
    typeof props.slotProps?.input === 'function' ? undefined : props.slotProps?.input;
  return (
    <TextField
      {...props}
      type={showPassword ? 'text' : 'password'}
      slotProps={{
        // Spread, not replaced: every slot the caller aims at another part of the field —
        // `inputLabel.shrink` above all, which is how MUI is told to lift a label off a value it
        // cannot see for itself — used to be dropped here, leaving the label sitting on top of the
        // value.
        ...props.slotProps,
        input: {
          ...props.slotProps?.input,
          // Appended, not substituted. The visibility toggle is this component's whole reason to
          // exist, so a caller cannot replace it — but a caller's own adornment must not vanish
          // either, which is what happened while this key simply overwrote whatever was there.
          endAdornment: (
            <>
              {inputSlotProps?.endAdornment}
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Icon icon={showPassword ? IconType.Visibility : IconType.VisibilityOff} />
                </IconButton>
              </InputAdornment>
            </>
          ),
        },
      }}
    />
  );
};
