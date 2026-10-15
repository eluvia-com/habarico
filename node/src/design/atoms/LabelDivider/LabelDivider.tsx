import React from 'react';
import {Divider as MuiDivider, DividerProps as MuiDividerProps, Typography} from '@mui/material';

export type LabelDividerProps = MuiDividerProps & {
  label: string;
};

export const LabelDivider = ({label, sx, ...rest}: LabelDividerProps) => {
  return (
    <MuiDivider {...rest} sx={{my: 3, ...sx}}>
      <Typography variant="overline" sx={{color: 'text.secondary', fontWeight: 'fontWeightMedium'}}>
        {label}
      </Typography>
    </MuiDivider>
  );
};
