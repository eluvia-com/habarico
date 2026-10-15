import React from 'react';
import InboxIcon from '@mui/icons-material/Inbox';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import {Divider, ListItemIcon, ListItemText, MenuItem, MenuList, Paper} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';

const meta: Meta<typeof MenuItem> = {
  title: 'design/atoms/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A single option inside a Menu or MenuList — selectable, disableable, with optional icon ' +
          'and text. Spacing is theme-driven: each item carries its own padding and a 4px gap to ' +
          'the next item (a sibling margin, so it applies the same in a `Menu`, a `Select` and a ' +
          'bare `MenuList`); a `Divider` breaks the group and resets the spacing.',
      },
    },
    controls: {include: ['selected', 'disabled', 'dense', 'children']},
  },
  argTypes: {
    selected: {control: 'boolean'},
    disabled: {control: 'boolean'},
    dense: {control: 'boolean'},
    children: {control: 'text'},
  },
  args: {children: 'Menu item'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof MenuItem>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Paper variant={'elevation'} sx={{width: 240}}>
      <MenuList sx={{p: 0.5}}>
        <MenuItem {...args} />
      </MenuList>
    </Paper>
  ),
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Paper variant={'elevation'} sx={{width: 240}}>
      <MenuList sx={{p: 0.5}}>
        <MenuItem>Default item</MenuItem>
        <MenuItem selected>Selected item</MenuItem>
        <MenuItem disabled>Disabled item</MenuItem>
        <MenuItem>
          <ListItemIcon>
            <InboxIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>With icon</ListItemText>
        </MenuItem>
      </MenuList>
    </Paper>
  ),
};

/**
 * Item spacing is owned by the theme: the list inset plus a 4px gap between consecutive items keep
 * them from sitting flush, and a `Divider` separates groups (its own margins are reset so the gap
 * stays even). This is the same layout the account menu popover relies on.
 */
export const Grouped: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Paper variant={'elevation'} sx={{width: 240}}>
      <MenuList sx={{p: 0.5}}>
        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem selected>
          <ListItemIcon>
            <SettingsIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider sx={{borderStyle: 'dashed'}} />
        <MenuItem>
          <ListItemIcon>
            <LogoutIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </MenuList>
    </Paper>
  ),
};
