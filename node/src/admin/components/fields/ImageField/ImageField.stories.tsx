import {ImageFieldProps} from 'react-admin';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {ImageField} from './ImageField';

/**
 * Read-only display for `image` values — a thumbnail that opens the full image in a dialog (via
 * the design `useDialog`) when clicked. `sx` sizes the thumbnail directly; a broken image URL
 * falls back to an icon, in both the thumbnail and the dialog, sized to that same footprint.
 */
const meta = {
  title: 'admin/fields/ImageField',
  component: ImageField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {avatar: 'https://mui.com/static/images/avatar/1.jpg'},
    controls: {include: ['label', 'emptyText']},
  },
  argTypes: {
    label: {control: 'text'},
    emptyText: {control: 'text'},
  },
  args: {
    source: 'avatar',
    label: 'Avatar',
    sx: {width: 96, height: 96, borderRadius: '50%', objectFit: 'cover'},
  },
  decorators: [withFieldShell],
} satisfies Meta<ImageFieldProps>;

export default meta;
type Story = StoryObj<ImageFieldProps>;

export const Playground: Story = {};

/** No value — nothing renders and the thumbnail is not clickable. */
export const Empty: Story = {
  parameters: {record: {avatar: null}, docs: {canvas: {sourceState: 'none'}}},
};

/**
 * `avatar` points at a URL that fails to load — both the thumbnail and the lightbox dialog fall
 * back to a broken-image icon instead of the browser's broken-image glyph.
 */
export const BrokenImage: Story = {
  parameters: {
    record: {avatar: 'https://example.invalid/missing.png'},
    docs: {canvas: {sourceState: 'none'}},
  },
};
