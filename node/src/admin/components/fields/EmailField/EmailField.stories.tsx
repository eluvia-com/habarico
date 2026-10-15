import {FieldProps} from '@admin/components/fields/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {EmailField} from './EmailField';

/**
 * Read-only display for `email` values — renders the address as a `mailto:` link (the click is stopped
 * from bubbling so it does not trigger a row navigation). Falls back to `emptyText` when the value is
 * blank, and marks the matched substring inline when the row carries a search highlight.
 */
const meta = {
  title: 'admin/fields/EmailField',
  component: EmailField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    record: {email: 'jane.doe@example.com'},
    controls: {include: ['label', 'emptyText']},
  },
  argTypes: {
    label: {control: 'text'},
    emptyText: {control: 'text'},
  },
  args: {
    source: 'email',
    label: 'Email',
  },
  decorators: [withFieldShell],
} satisfies Meta<FieldProps>;

export default meta;
type Story = StoryObj<FieldProps>;

export const Playground: Story = {};

/** No value — the field shows its `emptyText` (default `--`). */
export const Empty: Story = {
  parameters: {record: {email: null}, docs: {canvas: {sourceState: 'none'}}},
};

/**
 * A search match — `record.meta.highlights` supplies the value with the matched substring already
 * wrapped in `<mark>`; the field renders that value verbatim inside the `mailto:` link, so only
 * the matched part is marked.
 */
export const Highlighted: Story = {
  parameters: {
    record: {
      email: 'jane.doe@example.com',
      meta: {
        highlights: [{name: 'email', value: '<mark>jane.doe</mark>@example.com', label: 'Email'}],
      },
    },
    docs: {canvas: {sourceState: 'none'}},
  },
};
