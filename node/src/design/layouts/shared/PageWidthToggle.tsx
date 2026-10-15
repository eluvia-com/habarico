import React from 'react';
import {IconButton, IconButtonProps, Tooltip} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {useSettingsContext} from '../contexts/SettingsContext';

export type PageWidthToggleProps = Omit<IconButtonProps, 'color' | 'onChange'> & {
  /** Tooltip shown on the toggle; when omitted, no tooltip is rendered. */
  tooltip?: React.ReactNode;
};

/**
 * Full/centered page-width toggle shared by the shells. Reads and writes `pageWidth`
 * through `SettingsContext`, so it is presentational — the admin layer bridges the value
 * to its preferences store. Mirrors `ColorModeToggle`.
 */
export function PageWidthToggle({tooltip, sx, ...rest}: PageWidthToggleProps) {
  const {pageWidth, setPageWidth} = useSettingsContext();

  const button = (
    <IconButton
      onClick={() => setPageWidth(pageWidth === 'centered' ? 'full' : 'centered')}
      {...rest}
      sx={[{color: 'text.secondary'}, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Icon
        width={24}
        icon={pageWidth === 'centered' ? IconType.WidthWide : IconType.WidthNormal}
      />
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
}
