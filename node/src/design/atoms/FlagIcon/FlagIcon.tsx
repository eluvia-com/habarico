import React, {forwardRef, useState} from 'react';
import {Box, BoxProps, SxProps, Theme} from '@mui/material';
import {Icon, IconType} from '../Icon';

const baseSx: SxProps<Theme> = {
  width: 26,
  height: 20,
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '5px',
  alignItems: 'center',
  display: 'inline-flex',
  justifyContent: 'center',
  backgroundColor: 'background.neutral',
};

const baseClassName = 'mnl__icon__flag';

export type FlagIconProps = BoxProps & {
  code: string;
};

export const FlagIcon = forwardRef<HTMLSpanElement, FlagIconProps>(
  ({code, className, sx, ...other}, ref) => {
    const [failed, setFailed] = useState(false);
    // A different code can replace an earlier unsupported one — re-attempt loading it instead of
    // sticking to the previous failure. Adjusted during render (React's recommended pattern for
    // resetting state on a prop change) rather than an effect, so there's no extra render pass.
    const [trackedCode, setTrackedCode] = useState(code);
    if (code !== trackedCode) {
      setTrackedCode(code);
      setFailed(false);
    }

    return (
      <Box
        ref={ref}
        component="span"
        className={baseClassName.concat(className ? ` ${className}` : '')}
        sx={{...baseSx, ...sx}}
        {...other}
      >
        {failed ? (
          <Icon icon={IconType.Flag} sx={{fontSize: 14, color: 'text.disabled'}} />
        ) : (
          <Box
            component="img"
            loading="lazy"
            alt={code}
            src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code?.toUpperCase()}.svg`}
            onError={() => setFailed(true)}
            sx={{
              width: 1,
              height: 1,
              maxWidth: 'unset',
              objectFit: 'cover',
            }}
          />
        )}
      </Box>
    );
  }
);

FlagIcon.displayName = 'FlagIcon';
