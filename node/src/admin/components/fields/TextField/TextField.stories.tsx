import React from 'react';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withFieldShell} from '../_storyKit';
import {TextField, TextFieldProps} from './TextField';

/**
 * Read-only display for `string` values — the default field. Renders rich text when the value carries
 * markup, ellipsizes to a single line inside a collection (unless `multiline`), and can wrap the value
 * with muted `prefix` / `postfix` affixes. The read-side counterpart of `TextInput`.
 */
const meta = {
  title: 'admin/fields/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // Comfortably longer than the story's fixed-width card at any font size — `multiline` only has
    // a visible effect (see `Playground` below) when the text actually needs truncating or wrapping.
    record: {
      name: 'Acme Corporation International Trading, Logistics & Holdings Worldwide Enterprises Limited',
    },
    controls: {include: ['label', 'multiline', 'emptyText']},
  },
  argTypes: {
    label: {control: 'text'},
    multiline: {control: 'boolean'},
    emptyText: {control: 'text'},
  },
  args: {
    source: 'name',
    label: 'Name',
  },
  decorators: [withFieldShell],
} satisfies Meta<TextFieldProps>;

export default meta;
type Story = StoryObj<TextFieldProps>;

/**
 * `multiline` only branches when the field is rendered inside a collection cell (`isInCollection`)
 * — outside one it always keeps line breaks regardless. Simulated here via
 * `ValueLocationContextProvider` so toggling the control actually changes the canvas: off
 * truncates the long name to one ellipsized line, on wraps it in full.
 */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <ValueLocationContextProvider value={{isInCollection: true}}>
        <Story />
      </ValueLocationContextProvider>
    ),
  ],
};

/** `multiline` keeps line breaks (`pre-wrap`) instead of collapsing to a single ellipsized line. */
export const Multiline: Story = {
  parameters: {
    record: {note: 'First line of the note.\nSecond line with more detail.'},
    docs: {canvas: {sourceState: 'none'}},
  },
  args: {source: 'note', label: 'Note', multiline: true},
};

/** Explicit `prefix` / `postfix` affixes, rendered in the muted secondary color. */
export const WithAffixes: Story = {
  parameters: {record: {code: '4021'}, docs: {canvas: {sourceState: 'none'}}},
  args: {source: 'code', label: 'Code', prefix: '#', postfix: 'CZ'},
};

/** No value — the field shows its `emptyText`. */
export const Empty: Story = {
  parameters: {record: {name: null}, docs: {canvas: {sourceState: 'none'}}},
  args: {emptyText: '—'},
};

/**
 * Inside a collection, a long `emptyText` truncates with an ellipsis just like a real value does —
 * it renders through the same single-line container.
 */
export const EmptyInCollection: Story = {
  parameters: {record: {name: null}, docs: {canvas: {sourceState: 'none'}}},
  args: {
    emptyText: 'A very long empty text that would otherwise wrap across several lines',
  },
  decorators: [
    (Story) => (
      <ValueLocationContextProvider value={{isInCollection: true}}>
        <Story />
      </ValueLocationContextProvider>
    ),
  ],
};

/**
 * `multiline={false}` forces a single, ellipsized line even outside a collection — it overrides the
 * location-based default (wrap) instead of being ignored by it.
 */
export const SingleLineOutsideCollection: Story = {
  parameters: {
    record: {name: 'A very long company name that would otherwise wrap across several lines'},
    docs: {canvas: {sourceState: 'none'}},
  },
  args: {multiline: false},
};

/**
 * A search match — `record.meta.highlights` supplies the value with the matched substring already
 * wrapped in `<mark>`; the field is self-highlighting, so it renders that value verbatim as its own
 * inline highlight instead of the schema layer's whole-cell mark.
 */
export const Highlighted: Story = {
  parameters: {
    record: {
      name: 'Acme Corporation',
      meta: {
        highlights: [{name: 'name', value: '<mark>Acme</mark> Corporation', label: 'Name'}],
      },
    },
    docs: {canvas: {sourceState: 'none'}},
  },
};
