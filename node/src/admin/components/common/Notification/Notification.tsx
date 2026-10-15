import {useNotificationContext} from 'ra-core';
import type {NotificationPayload} from 'ra-core';
import React, {useCallback} from 'react';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {Box} from '@mui/material';
import {NotificationItem} from './NotificationItem';

const notificationIds = new WeakMap<NotificationPayload, number>();
let nextId = 0;

const getNotificationId = (n: NotificationPayload): number => {
  if (!notificationIds.has(n)) {
    notificationIds.set(n, nextId++);
  }
  return notificationIds.get(n)!;
};

export const Notification = () => {
  const {notifications, setNotifications} = useNotificationContext();
  const {notificationAutoHideDuration} = useAdminConfig();

  const handleClose = useCallback(
    (notification: NotificationPayload) => {
      setNotifications((prev) => prev.filter((n) => n !== notification));
    },
    [setNotifications]
  );

  if (notifications.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 1400,
        maxWidth: 600,
        width: '100%',
        px: 2,
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={getNotificationId(notification)}
          notification={notification}
          onClose={handleClose}
          defaultAutoHideDuration={notificationAutoHideDuration}
        />
      ))}
    </Box>
  );
};
