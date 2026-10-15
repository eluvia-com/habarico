import React from 'react';
import {Button, Stack} from '@mui/material';
import {IconType} from '../../../atoms/Icon';
import {InspectorPanel, InspectorSection} from '../../../organisms/InspectorPanel';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';
import {NotificationsLabels} from '../../types';
import {NotificationItem} from './NotificationItem';
import {NotificationsPanelProps} from './types';

// English fallbacks; the admin layer overrides these with translated strings.
const DEFAULT_NOTIFICATIONS_LABELS: NotificationsLabels = {
  title: 'Notifications',
  unread: 'unread',
  new: 'New',
  beforeThat: 'Before that',
  viewAll: 'View all',
};

// How many of the most recent notifications each section previews; the rest live behind
// the footer "view all" action.
const NEW_COUNT = 2;
const RECENT_COUNT = 5;

/**
 * The notifications inspector — built on `InspectorPanel` (the same shell as the settings
 * panel, for a unified UX) with two sections, recent ("new") and older ("before that"),
 * and a footer "view all" action. Controlled via `open` / `onClose`; the toggle bell
 * (`NotificationsToggle`) and the open state live in the layout. Notifications are read
 * from the layout's dynamic context, so it stays presentational.
 */
export const NotificationsPanel = ({open, onClose, labels, onViewAll}: NotificationsPanelProps) => {
  const {notifications} = useLayoutDynamicContext();

  const l = {...DEFAULT_NOTIFICATIONS_LABELS, ...labels};

  const items = notifications ?? [];
  const totalUnread = items.filter((item) => item.isUnread).length;

  const newItems = items.slice(0, NEW_COUNT);
  const olderItems = items.slice(NEW_COUNT, RECENT_COUNT);

  return (
    <InspectorPanel
      open={open}
      onClose={onClose}
      icon={IconType.Notifications}
      title={l.title}
      subtitle={totalUnread > 0 ? `${totalUnread} ${l.unread}` : undefined}
      footer={
        <Button
          fullWidth
          variant="text"
          color="inherit"
          onClick={onViewAll}
          sx={{color: 'text.secondary'}}
        >
          {l.viewAll}
        </Button>
      }
    >
      {newItems.length > 0 && (
        <InspectorSection label={l.new}>
          <Stack spacing={0.5}>
            {newItems.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </Stack>
        </InspectorSection>
      )}
      {olderItems.length > 0 && (
        <InspectorSection label={l.beforeThat}>
          <Stack spacing={0.5}>
            {olderItems.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </Stack>
        </InspectorSection>
      )}
    </InspectorPanel>
  );
};
