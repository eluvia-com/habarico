import {FieldProps} from '@admin/components/fields/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {UrlField} from './UrlField';

/**
 * Read-only display for `url` values — renders the value as an external link (`target="_blank"`,
 * `rel="noopener noreferrer"`; the click is stopped from bubbling so it does not trigger row
 * navigation). Falls back to `emptyText` when blank, and marks the matched substring inline on a
 * search highlight. Only an `http`/`https` or relative value becomes a link — any other scheme is
 * rendered as plain text, so a `javascript:` or `data:` value stored on the record is readable but
 * not clickable.
 */
const meta = {
  title: 'admin/fields/UrlField',
  component: UrlField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {website: 'https://example.com'},
    controls: {include: ['label', 'emptyText']},
  },
  argTypes: {
    label: {control: 'text'},
    emptyText: {control: 'text'},
  },
  args: {
    source: 'website',
    label: 'Website',
  },
  decorators: [withFieldShell],
} satisfies Meta<FieldProps>;

export default meta;
type Story = StoryObj<FieldProps>;

export const Playground: Story = {};

/** No value — the field shows its `emptyText` (default `--`). */
export const Empty: Story = {
  parameters: {record: {website: null}, docs: {canvas: {sourceState: 'none'}}},
};
