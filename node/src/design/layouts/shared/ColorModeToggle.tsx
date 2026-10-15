import React from 'react';
import {IconButton, IconButtonProps, Tooltip} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {useSettingsContext} from '../contexts/SettingsContext';

export type ColorModeToggleProps = Omit<IconButtonProps, 'color' | 'onChange'> & {
  /** Tooltip shown on the toggle; when omitted, no tooltip is rendered. */
  tooltip?: React.ReactNode;
};

/**
 * Light/dark mode toggle shared by all shells. Reads and writes `colorMode` through
 * `SettingsContext`, so it is presentational — the admin layer bridges the value to
 * the react-admin theme store.
 */
export function ColorModeToggle({tooltip, sx, ...rest}: ColorModeToggleProps) {
  const {colorMode, setColorMode} = useSettingsContext();

  const button = (
    <IconButton
      onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
      {...rest}
      sx={[{color: 'text.secondary'}, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Icon width={24} icon={colorMode === 'dark' ? IconType.LightMode : IconType.DarkMode} />
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
}
