import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, padDecorator} from '../../_storyKit';
import {RouterLink} from './RouterLink';

const meta: Meta<typeof RouterLink> = {
  title: 'design/atoms/RouterLink',
  component: RouterLink,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Thin wrapper over the react-router `Link` that exposes a `href` prop instead of `to`. ' +
          'Use it for internal navigation so links stay client-side routed.',
      },
    },
    controls: {include: ['href', 'children']},
  },
  argTypes: {
    href: {control: 'text'},
    children: {control: 'text'},
  },
  args: {href: '/dashboard', children: 'Go to dashboard'},
  decorators: [
    padDecorator,
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RouterLink>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Links: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      <RouterLink href={'/dashboard'}>Dashboard</RouterLink>
      <RouterLink href={'/settings'}>Settings</RouterLink>
      <RouterLink href={'/profile'}>Profile</RouterLink>
    </Row>
  ),
};
