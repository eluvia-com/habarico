import React from 'react';
import {ButtonProps, CircularProgress, CircularProgressProps, useTheme} from '@mui/material';
import {ColorType} from '../../theme/core';

const circularProgressSize = {
  small: 12,
  medium: 16,
  large: 24,
};

const circularProgressThickness = {
  small: 2,
  medium: 2,
  large: 3,
};

export type ButtonLoaderProps = {
  size?: ButtonProps['size'];
  color?: ButtonProps['color'];
  variant?: ButtonProps['variant'];
};

export const ButtonLoader = ({size, color, variant}: ButtonLoaderProps) => {
  const theme = useTheme();

  let circularProgressColor;
  if (color && ['primary', 'secondary', 'success', 'error', 'warning', 'info'].includes(color)) {
    const paletteIndex = color as ColorType;
    if (variant === 'contained') circularProgressColor = theme.palette[paletteIndex].contrastText;
    else circularProgressColor = theme.palette[paletteIndex].main;
  } else {
    if (variant === 'contained') circularProgressColor = theme.palette.primary.contrastText;
    else circularProgressColor = theme.palette.primary.main;
  }

  const circularProgressProps: CircularProgressProps = {
    size: circularProgressSize[size ?? 'medium'],
    thickness: circularProgressThickness[size ?? 'medium'],
    sx: {
      '& .MuiCircularProgress-root': {
        color: circularProgressColor,
      },
      '& .MuiCircularProgress-svg': {
        color: circularProgressColor,
      },
    },
  };
  return <CircularProgress {...circularProgressProps} />;
};
