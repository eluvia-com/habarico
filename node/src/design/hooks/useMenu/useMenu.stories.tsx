import React from 'react';
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu as MuiMenu,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {useMenu} from './useMenu';

const meta: Meta<typeof MuiMenu> = {
  title: 'design/hooks/useMenu',
  component: MuiMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dropdown list of actions anchored to a trigger, opened via the design-layer `useMenu` ' +
          'hook. Click the button to open it.',
      },
    },
    // `component` is the underlying MUI `Menu`, and neither story below reads args — without this,
    // Storybook auto-infers a full, entirely dead argTypes table.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof MuiMenu>;

// "Show code" only serializes the JSX `render` returns, never the `useMenu()` call itself, and the
// `Menu` it returns is an anonymous `useMemo` component (no `displayName`), so it'd otherwise print
// as `<Component>`.
const buildDefaultSource = () => `const {Menu, openMenu} = useMenu();

<>
  <Button variant="contained" onClick={openMenu}>
    Open menu
  </Button>
  <Menu>
    <MenuItem onClick={() => {}}>User profile</MenuItem>
    <MenuItem onClick={() => {}}>Logout</MenuItem>
  </Menu>
</>`;

const buildActionsSource = () => `const {Menu, openMenu} = useMenu();

<>
  <Button variant="contained" onClick={openMenu}>
    Open menu
  </Button>
  <Menu>
    <MenuItem onClick={() => {}}>
      <ListItemIcon>
        <Icon icon={IconType.Description} />
      </ListItemIcon>
      <ListItemText>Duplikovat</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => {}} sx={{color: 'error.main'}}>
      <ListItemIcon>
        <Icon icon={IconType.Download} />
      </ListItemIcon>
      <ListItemText>Archivovat</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={() => {}}>
      <ListItemIcon>
        <Icon icon={IconType.Receipt} />
      </ListItemIcon>
      <ListItemText>Inzerce</ListItemText>
    </MenuItem>
  </Menu>
</>`;

export const Default: Story = {
  parameters: {docs: {source: {transform: (_code: string) => buildDefaultSource()}}},
  render: (_args) => {
    const {Menu, openMenu} = useMenu();
    return (
      <>
        <Button variant={'contained'} onClick={openMenu}>
          Open menu
        </Button>
        <Menu>
          <MenuItem onClick={() => {}}>User profile</MenuItem>
          <MenuItem onClick={() => {}}>Logout</MenuItem>
        </Menu>
      </>
    );
  },
};

/**
 * The redesigned dropdown: rounded paper with a soft shadow and a subtle gradient background, and
 * polished menu items — a leading icon that tints with the item, a consistent icon↔label gap, a
 * destructive (red) item, and a divider grouping the last action.
 */
export const Actions: Story = {
  parameters: {docs: {source: {transform: (_code: string) => buildActionsSource()}}},
  render: (_args) => {
    const {Menu, openMenu} = useMenu();
    return (
      <>
        <Button variant={'contained'} onClick={openMenu}>
          Open menu
        </Button>
        <Menu>
          <MenuItem onClick={() => {}}>
            <ListItemIcon>
              <Icon icon={IconType.Description} />
            </ListItemIcon>
            <ListItemText>Duplikovat</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {}} sx={{color: 'error.main'}}>
            <ListItemIcon>
              <Icon icon={IconType.Download} />
            </ListItemIcon>
            <ListItemText>Archivovat</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => {}}>
            <ListItemIcon>
              <Icon icon={IconType.Receipt} />
            </ListItemIcon>
            <ListItemText>Inzerce</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  },
};
