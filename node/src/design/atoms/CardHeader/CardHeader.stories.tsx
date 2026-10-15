import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardHeaderProps,
  IconButton,
  Typography,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof CardHeader> = {
  title: 'design/atoms/CardHeader',
  component: CardHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Header row for a Card — a title with an optional subheader, leading avatar and overflow ' +
          'action. A bottom divider is part of the theme and shows **by default**; opt out with ' +
          '`sx={{borderBottom: "none"}}` (there is no `divider` prop — see the theme override).',
      },
    },
    controls: {include: ['title', 'subheader', 'showAvatar', 'showAction', 'divider']},
  },
  argTypes: {
    title: {control: 'text'},
    subheader: {control: 'text'},
  },
  args: {title: 'Card title', subheader: 'Supporting subheader text'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof CardHeader>;

/** Story-only: `avatar`/`action` take elements, and there is no real `divider` prop (see above) —
 * these swap in a sample avatar/action and the theme's default border for the Controls panel. */
type PlaygroundArgs = CardHeaderProps & {
  showAvatar?: boolean;
  showAction?: boolean;
  divider?: boolean;
};

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {showAvatar: false, showAction: false, divider: true},
  argTypes: {
    showAvatar: {control: 'boolean'},
    showAction: {control: 'boolean'},
    divider: {control: 'boolean'},
  },
  render: ({showAvatar, showAction, divider, ...args}) => (
    <Card sx={{maxWidth: 400}}>
      <CardHeader
        {...args}
        avatar={showAvatar ? <Avatar>H</Avatar> : undefined}
        action={
          showAction ? (
            <IconButton aria-label={'settings'}>
              <MoreVertIcon />
            </IconButton>
          ) : undefined
        }
        sx={divider ? undefined : {borderBottom: 'none'}}
      />
      <CardContent>
        <Typography variant={'body2'} color={'text.secondary'}>
          Card content.
        </Typography>
      </CardContent>
    </Card>
  ),
};

export const WithAvatarAndAction: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Card sx={{maxWidth: 400}}>
      <CardHeader
        avatar={<Avatar>H</Avatar>}
        action={
          <IconButton aria-label={'settings'}>
            <MoreVertIcon />
          </IconButton>
        }
        title={'With avatar & action'}
        subheader={'2 hours ago'}
      />
      <CardContent>
        <Typography variant={'body2'} color={'text.secondary'}>
          Card content.
        </Typography>
      </CardContent>
    </Card>
  ),
};

/** The divider is on by default; opt out per instance with `sx={{borderBottom: 'none'}}`. */
export const WithoutDivider: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Card sx={{maxWidth: 400}}>
      <CardHeader title={'Card title'} subheader={'No divider'} sx={{borderBottom: 'none'}} />
      <CardContent>
        <Typography variant={'body2'} color={'text.secondary'}>
          Card content.
        </Typography>
      </CardContent>
    </Card>
  ),
};
