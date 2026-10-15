import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {ChoicesInput} from '../ChoicesInput';
import {TextInput} from '../TextInput';
import {withInputShell} from '../_storyKit';
import {FormArrayInput, FormArrayInputProps} from './FormArrayInput';

const GENDERS = [
  {value: 'female', label: 'Female'},
  {value: 'male', label: 'Male'},
  {value: 'other', label: 'Other'},
];

const OWNERS = [
  {name: 'Alice Doe', email: 'alice@example.com', gender: 'female'},
  {name: 'Bob Smith', email: 'bob@example.com', gender: 'male'},
];

const NEW_OWNER = {name: '', email: '', gender: ''};

/**
 * Tabular, editable array input — renders a repeatable list of column inputs as the design
 * `FormTable`. Each child is a plain React Admin input carrying its own `source`; `FormArrayInput`
 * binds it per row to `owners.{index}.{source}` and bridges add / remove / clear back to the
 * field-array. Structural labels ("Add", "Clear list", the row count, …) come from the React Admin
 * locale. Stories render inside a fixed-width card via the shared input shell.
 */
const meta = {
  title: 'admin/inputs/FormArrayInput',
  component: FormArrayInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['inline', 'disabled', 'density']},
    // Wider than the shell's default 600: at that width the three columns can't each get their
    // `COLUMN_MIN_WIDTH`, so every row falls back to the same auto-stacked layout regardless of
    // `inline` — the Playground/Stacked toggle would look broken (see `FormTableRow`).
    width: 800,
  },
  argTypes: {
    inline: {control: 'boolean'},
    disabled: {control: 'boolean'},
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
  },
  args: {
    source: 'owners',
    inline: true,
    disabled: false,
    density: 'standard',
    defaultValue: NEW_OWNER,
  },
  decorators: [withInputShell],
} satisfies Meta<FormArrayInputProps>;

export default meta;
type Story = StoryObj<FormArrayInputProps>;

// The column inputs are passed as *direct* children (an array `FormArrayInput` maps to columns), so
// they can't be wrapped in a component — a wrapper would collapse to a single column.
const ownerColumns = [
  <TextInput key={'name'} source={'name'} label={'Name'} />,
  <TextInput key={'email'} source={'email'} label={'Email'} />,
  <ChoicesInput key={'gender'} source={'gender'} label={'Gender'} choices={GENDERS} />,
];

/** Interactive instance — add rows, edit the cells, remove a row, or clear the whole list. */
export const Playground: Story = {
  parameters: {record: {owners: OWNERS}},
  render: (args) => <FormArrayInput {...args}>{ownerColumns}</FormArrayInput>,
};

/**
 * Stacked (`inline={false}`) — each row lays its inputs out under each other as labelled property
 * rows (`PropertyList` / `PropertyItem`) instead of side by side. Each child's `label` moves onto
 * its property row and the input renders bare.
 */
export const Stacked: Story = {
  args: {inline: false},
  parameters: {record: {owners: OWNERS}, docs: {canvas: {sourceState: 'none'}}},
  render: (args) => <FormArrayInput {...args}>{ownerColumns}</FormArrayInput>,
};

/** Empty state — a muted message, with the footer still offering "Add". */
export const Empty: Story = {
  parameters: {record: {owners: []}, docs: {canvas: {sourceState: 'none'}}},
  render: (args) => <FormArrayInput {...args}>{ownerColumns}</FormArrayInput>,
};

/** Disabled — the add / remove / clear affordances and every row input are locked. */
export const Disabled: Story = {
  args: {disabled: true},
  parameters: {record: {owners: OWNERS}, docs: {canvas: {sourceState: 'none'}}},
  render: (args) => <FormArrayInput {...args}>{ownerColumns}</FormArrayInput>,
};

/** Density — `standard` (default) vs. the tighter `compact` and roomier `comfortable`. */
export const Densities: Story = {
  parameters: {record: {owners: OWNERS}, docs: {canvas: {sourceState: 'none'}}},
  render: (args) => (
    <>
      {(['compact', 'standard', 'comfortable'] as const).map((density) => (
        <FormArrayInput key={density} {...args} density={density}>
          {ownerColumns}
        </FormArrayInput>
      ))}
    </>
  ),
};
