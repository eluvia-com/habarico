import React from 'react';
import {Avatar, ListItemAvatar, ListItemButton, ListItemText, Typography} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {LayoutNotification} from '../../types';

export type NotificationItemProps = {
  notification: LayoutNotification;
};

/**
 * A single notification row inside a `NotificationsPanel` section: optional avatar, a
 * title with an inline muted description, and a timestamp. Unread rows are tinted.
 */
export const NotificationItem = ({notification}: NotificationItemProps) => (
  <ListItemButton
    sx={{
      py: 1,
      px: 1,
      borderRadius: 1,
      alignItems: 'flex-start',
      ...(notification.isUnread && {backgroundColor: 'action.selected'}),
    }}
  >
    {notification.avatar && (
      <ListItemAvatar>
        <Avatar
          alt={notification.title}
          src={notification.avatar}
          sx={{backgroundColor: 'background.neutral', color: 'text.disabled'}}
        >
          <Icon icon={IconType.BrokenImage} />
        </Avatar>
      </ListItemAvatar>
    )}
    <ListItemText
      primary={
        <Typography variant="subtitle2">
          {notification.title}
          <Typography component="span" variant="body2" sx={{color: 'text.secondary'}}>
            &nbsp; {notification.description}
          </Typography>
        </Typography>
      }
      secondary={
        <Typography
          variant="caption"
          sx={{mt: 0.5, gap: 0.5, display: 'flex', alignItems: 'center', color: 'text.disabled'}}
        >
          <Icon width={14} icon={IconType.Schedule} />
          {notification.postedAt}
        </Typography>
      }
    />
  </ListItemButton>
);
