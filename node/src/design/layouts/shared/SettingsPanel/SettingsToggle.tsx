import React from 'react';
import {IconButton, IconButtonProps, Tooltip} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';

export type SettingsToggleProps = IconButtonProps & {
  /** Tooltip shown on the cog. */
  tooltip?: string;
  /** Whether the associated panel is open (highlights the cog). */
  open?: boolean;
};

/**
 * The header settings cog that opens the `SettingsPanel`. The open state lives in the
 * layout (mirroring `NotificationsToggle`), so this is a thin presentational trigger.
 */
export const SettingsToggle = ({open, tooltip, sx, ...rest}: SettingsToggleProps) => {
  const button = (
    <IconButton
      {...rest}
      sx={[{color: open ? 'primary.main' : 'text.secondary'}, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Icon icon={IconType.Settings} width={24} />
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};
