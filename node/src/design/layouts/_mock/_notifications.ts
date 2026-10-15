import {LayoutNotification} from '../types';
import {_fullName, _id, _time} from './utils';

export const _notifications: LayoutNotification[] = [
  {
    id: _id(0),
    title: 'Delivery processing',
    description: 'Your order is being shipped',
    type: 'order-shipped',
    postedAt: _time(0),
    isUnread: false,
  },
  {
    id: _id(1),
    title: 'Your order is placed',
    description: 'waiting for shipping',
    type: 'order-placed',
    postedAt: _time(1),
    isUnread: true,
  },
  {
    id: _id(2),
    title: _fullName(2),
    description: 'answered to your comment on the Minimal',
    avatar: 'https://i.pravatar.cc/300?img=1',
    type: 'friend-interactive',
    postedAt: _time(2),
    isUnread: true,
  },
  {
    id: _id(3),
    title: 'You have new message',
    description: '5 unread messages',
    type: 'chat-message',
    postedAt: _time(3),
    isUnread: false,
  },
  {
    id: _id(4),
    title: 'You have new mail',
    description: 'sent from Guido Padberg',
    type: 'mail',
    postedAt: _time(4),
    isUnread: false,
  },
];
