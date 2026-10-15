import React from 'react';
import {Box, SxProps, Theme} from '@mui/material';
import {Button, ButtonProps} from '../Button';
import {ButtonLoader} from '../ButtonLoader';

export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loader?: React.ReactNode;
};

export const LoadingButton = ({
  loading,
  children,
  size,
  color,
  variant,
  sx,
  loader = <ButtonLoader size={size} color={color} variant={variant} />,
  ...rest
}: LoadingButtonProps) => {
  const darkenOverlay = variant === 'contained';

  const finalSx: SxProps<Theme> = [
    ...(Array.isArray(sx) ? sx : [sx]),
    {
      position: 'relative', // in order to correctly position overlay and loader
      overflow: 'hidden', // in order to mask corners of the overflow
    },
  ];

  return (
    <Button size={size} color={color} variant={variant} sx={finalSx} {...rest}>
      {children}
      {loading && (
        <>
          <Box
            component={'span'}
            sx={{
              position: 'absolute',
              backdropFilter: 'blur(1px)',
              ...(darkenOverlay
                ? {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }
                : {
                    top: '2px',
                    left: '2px',
                    right: '2px',
                    bottom: '2px',
                  }),
            }}
          />
          <Box
            component={'span'}
            sx={{
              position: 'absolute',
              top: '60%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {loader}
          </Box>
        </>
      )}
    </Button>
  );
};
