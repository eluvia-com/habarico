import {useTranslate} from 'ra-core';
import type {NotificationPayload} from 'ra-core';
import React, {useEffect} from 'react';
import {Alert} from '@mui/material';

interface NotificationItemProps {
  notification: NotificationPayload;
  onClose: (notification: NotificationPayload) => void;
  defaultAutoHideDuration: number;
}

export const NotificationItem = ({
  notification,
  onClose,
  defaultAutoHideDuration,
}: NotificationItemProps) => {
  const translate = useTranslate();
  const {message, type, notificationOptions} = notification;
  const {autoHideDuration: autoHideDurationFromOptions, messageArgs} = notificationOptions ?? {};
  const autoHideDuration =
    autoHideDurationFromOptions === undefined
      ? defaultAutoHideDuration
      : autoHideDurationFromOptions;

  useEffect(() => {
    if (autoHideDuration === null) return;
    const timer = setTimeout(() => onClose(notification), autoHideDuration);
    return () => clearTimeout(timer);
  }, [notification, autoHideDuration, onClose]);

  const translatedMessage =
    typeof message === 'string'
      ? translate(message, {_: messageArgs?._ ?? message, ...messageArgs})
      : message;

  return (
    <Alert severity={type} onClose={() => onClose(notification)} sx={{boxShadow: 3}}>
      {translatedMessage}
    </Alert>
  );
};
