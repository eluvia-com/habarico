import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {LayoutNotification} from '../../types';
import {NotificationItem} from './NotificationItem';

const meta: Meta<typeof NotificationItem> = {
  title: 'design/layouts/shared/NotificationsPanel/NotificationItem',
  component: NotificationItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A single row inside `NotificationsPanel`: optional avatar, a title with an inline ' +
          'muted description, and a timestamp. Unread rows are tinted. The avatar uses MUI ' +
          "`Avatar`'s native `src` fallback, so a broken image URL swaps in an icon instead of " +
          "the browser's broken-image glyph.",
      },
    },
    // `notification` is a single demo data object, not a value worth flattening into Controls —
    // without this Storybook auto-infers a full argTypes table the stories never wire up. Note:
    // every `render` below still declares an unused `_args` parameter — Storybook derives
    // `__isArgsStory` from `render.length > 0`, so a zero-arg `render: () => (...)` silently
    // disables this filter (and "Show code"'s dynamic JSX serialization, falling back to printing
    // the story object's literal source) regardless of what's set here.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof NotificationItem>;

const _base: LayoutNotification = {
  id: 1,
  type: 'friend-interactive',
  title: 'Jane Doe',
  description: 'answered to your comment on the Minimal',
  avatar: 'https://i.pravatar.cc/300?img=1',
  postedAt: '2 hours ago',
  isUnread: true,
};

/** Unread row with a working avatar image. */
export const Default: Story = {
  render: (_args) => <NotificationItem notification={_base} />,
};

/** No `avatar` supplied — only the text content renders, no `ListItemAvatar` at all. */
export const NoAvatar: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <NotificationItem
      notification={{
        id: 2,
        type: 'chat-message',
        title: 'You have new message',
        description: '5 unread messages',
        postedAt: '3 hours ago',
        isUnread: false,
      }}
    />
  ),
};

/**
 * `avatar` points at a URL that fails to load — MUI `Avatar` falls back to a broken-image icon
 * instead of the browser's broken-image glyph.
 */
export const BrokenImage: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <NotificationItem notification={{..._base, avatar: 'https://example.invalid/missing.png'}} />
  ),
};
