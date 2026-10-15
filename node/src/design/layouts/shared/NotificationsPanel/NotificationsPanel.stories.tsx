import React, {useEffect, useState} from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {_notifications} from '../../_mock';
import {LayoutDynamicProvider, useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';
import {LayoutNotification, NotificationsLabels} from '../../types';
import {NotificationsPanel} from './NotificationsPanel';
import {NotificationsToggle} from './NotificationsToggle';

const meta: Meta<typeof NotificationsPanel> = {
  title: 'design/layouts/shared/NotificationsPanel',
  component: NotificationsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The header notifications bell (`NotificationsToggle`) and its inspector ' +
          '(`NotificationsPanel`). Built on `InspectorPanel` (the same shell as the settings panel, ' +
          'for a unified UX): two sections — recent ("new") and older ("before that") — and a footer ' +
          '"view all" action. The bell and the panel are separate — the layout owns the open state ' +
          '(like the settings toggle) and places the panel under its `LayoutSection`. Notifications ' +
          "are read from the layout's dynamic context, so both are presentational. Labels default to " +
          'English and are overridden with translated strings in the app. Click the bell to open.',
      },
    },
    // Every real prop (`open`/`onClose`/`labels`/`onViewAll`) is either driven by the click
    // interaction below or a nested labels object not worth flattening into Controls — without
    // this Storybook auto-infers a full argTypes table the story never wires up. Note: `render`
    // below still declares an unused `_args` parameter — Storybook derives `__isArgsStory` from
    // `render.length > 0`, so a zero-arg `render: () => (...)` silently disables this filter (and
    // "Show code"'s dynamic JSX serialization, falling back to printing the story object's literal
    // source) regardless of what's set here.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof NotificationsPanel>;

// Compose the bell + controlled panel the way the layout does, wiring the notifications into
// the dynamic context (the real data source) so they can be shown in isolation.
type DemoProps = {
  notifications: LayoutNotification[];
  labels?: Partial<NotificationsLabels>;
  tooltip?: string;
};

const DemoContent = ({notifications, labels, tooltip}: DemoProps) => {
  const [open, setOpen] = useState(false);
  const {setNotifications} = useLayoutDynamicContext();
  useEffect(() => {
    setNotifications(notifications);
  }, [notifications, setNotifications]);
  return (
    <>
      <NotificationsToggle open={open} onClick={() => setOpen(true)} tooltip={tooltip} />
      <NotificationsPanel open={open} onClose={() => setOpen(false)} labels={labels} />
    </>
  );
};

const Demo = (props: DemoProps) => (
  <LayoutDynamicProvider currentUser={null}>
    <DemoContent {...props} />
  </LayoutDynamicProvider>
);

/** Default demo — a mix of read and unread notifications; the badge counts the unread. */
export const Default: Story = {
  render: (_args) => <Demo notifications={_notifications} tooltip={'Notifications'} />,
};
