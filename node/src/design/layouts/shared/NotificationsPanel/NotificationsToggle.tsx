import React from 'react';
import {Badge, IconButton, Tooltip} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';
import {NotificationsToggleProps} from './types';

/**
 * The header notifications bell: a badge with the unread count that opens the
 * `NotificationsPanel`. Reads notifications from the layout's dynamic context, so the
 * panel state itself is owned by the layout (mirroring the settings toggle). Renders
 * nothing while the feature is disabled / not loaded (`notifications === null`), and is
 * inert while there are none.
 */
export const NotificationsToggle = ({
  open,
  tooltip,
  onClick,
  sx,
  ...rest
}: NotificationsToggleProps) => {
  const {notifications} = useLayoutDynamicContext();

  if (notifications === null) return null;

  const hasSome = notifications.length > 0;
  const totalUnread = notifications.filter((item) => item.isUnread).length;

  const bell = (
    <IconButton
      {...rest}
      onClick={hasSome ? onClick : undefined}
      sx={[{color: open ? 'primary.main' : 'text.secondary'}, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Badge badgeContent={totalUnread} color="error">
        <Icon width={24} icon={IconType.Notifications} />
      </Badge>
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{bell}</Tooltip> : bell;
};
