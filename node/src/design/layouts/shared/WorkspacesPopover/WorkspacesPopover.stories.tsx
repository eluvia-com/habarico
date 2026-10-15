import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {_workspaces} from '../../_mock';
import {LayoutWorkspace} from '../../types';
import {WorkspacesPopover} from './WorkspacesPopover';

const meta: Meta<typeof WorkspacesPopover> = {
  title: 'design/layouts/shared/WorkspacesPopover',
  component: WorkspacesPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The workspace switcher shown in the nav header: the current workspace as a trigger ' +
          '(24px logo, title and info chip) that opens a popover listing every workspace in ' +
          '`items`. A broken `logo` URL falls back to a broken-image icon tile instead of the ' +
          'browser’s broken-image glyph. Click the trigger to open the popover.',
      },
    },
    controls: {include: ['collapsed']},
  },
  argTypes: {
    collapsed: {control: 'boolean'},
  },
  args: {items: _workspaces, collapsed: false},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof WorkspacesPopover>;

/** Default workspace switcher with title, info chip and chevron. */
export const Default: Story = {};

/** Collapsed nav rail — only the logo is shown, no title/info/chevron. */
export const Collapsed: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {collapsed: true},
};

const _brokenLogoWorkspaces: LayoutWorkspace[] = [
  {..._workspaces[0], logo: 'https://example.invalid/missing.png'},
  ..._workspaces.slice(1),
];

/**
 * The current workspace's `logo` fails to load — the trigger falls back to a broken-image icon
 * tile instead of the browser's broken-image glyph. Open the popover to see the same fallback on
 * that workspace's row, next to the other, correctly loading logos.
 */
export const BrokenLogo: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {items: _brokenLogoWorkspaces},
};
