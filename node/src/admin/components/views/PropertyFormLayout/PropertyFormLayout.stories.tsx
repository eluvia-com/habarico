import React from 'react';
import {FormDataConsumer, required} from 'react-admin';
import {BooleanInput} from '@admin/components/inputs/BooleanInput';
import {ChoicesInput} from '@admin/components/inputs/ChoicesInput';
import {NumberInput} from '@admin/components/inputs/NumberInput';
import {TextInput} from '@admin/components/inputs/TextInput';
import {Box} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {withInputShell} from '../../inputs/_storyKit';
import {PropertyFormLayout, PropertyFormLayoutProps} from './PropertyFormLayout';

const asChoices = (values: string[]) => values.map((value) => ({value, label: value}));

const PROPERTY_TYPES = asChoices(['Apartment', 'Building', 'Land']);
const PROPERTY_LAYOUTS = asChoices(['1 + kk', '1 + 1', '2 + kk', '2 + 1', '3 + 1']);

const RECORD = {
  address: 'Jihlavská 521/62',
  unit_number: '521Z2',
  type: 'Apartment',
  layout: '2 + 1',
  area: 50,
  floor_number: 2,
  floor_count: 6,
  residential: true,
};

/**
 * Lays React Admin inputs out in the design `PropertyList` grid (label + input pairs) instead of
 * React Admin's own stacked, outlined-label inputs — the edit-view counterpart of
 * `PropertyShowLayout`. Drop it inside a `FormShell` / `SimpleForm` and pass plain inputs: each
 * one's label is pulled automatically (its own `label` prop, else the i18n label for its `source`)
 * and moved into the `PropertyItem` label column, with the input's own label suppressed.
 */
const meta = {
  title: 'admin/views/PropertyFormLayout',
  component: PropertyFormLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['columns', 'columnGap', 'rowGap', 'density', 'orientation']},
    record: RECORD,
    width: 700,
  },
  argTypes: {
    columns: {control: {type: 'number', min: 1, max: 3}},
    columnGap: {control: {type: 'number', min: 0, max: 8}},
    rowGap: {control: {type: 'number', min: 0, max: 8}},
    density: {control: 'inline-radio', options: ['compact', 'standard', 'comfortable']},
    orientation: {control: 'inline-radio', options: ['auto', 'horizontal', 'vertical']},
  },
  args: {columns: 2, density: 'compact'},
  decorators: [withInputShell],
} satisfies Meta<PropertyFormLayoutProps>;

export default meta;
type Story = StoryObj<PropertyFormLayoutProps>;

/**
 * Interactive instance — a basic-properties edit form. Change `columns` / `density` /
 * `orientation` in Controls: the grid behaves exactly like a `PropertyList` of inputs instead of
 * values.
 */
export const Playground: Story = {
  render: (args) => (
    <PropertyFormLayout {...args}>
      <TextInput source="address" validate={required()} size="small" />
      <ChoicesInput source="type" choices={PROPERTY_TYPES} size="small" />
      <ChoicesInput source="layout" choices={PROPERTY_LAYOUTS} size="small" />
      <NumberInput source="area" size="small" />
      <NumberInput source="floor_number" size="small" />
      <BooleanInput source="residential" size="small" />
    </PropertyFormLayout>
  ),
};

/**
 * Label resolution — `address` has no `label` prop, so it falls back to the i18n label for its
 * `source` (humanized when no translation is registered); `unit_number` sets its own `label`; and
 * `floor_count` suppresses its label entirely with `label={false}`, leaving the value column alone
 * against an empty label cell.
 */
export const AutoLabels: Story = {
  args: {columns: 1},
  render: (args) => (
    <PropertyFormLayout {...args}>
      <TextInput source="address" size="small" />
      <TextInput source="unit_number" label="Unit no." size="small" />
      <NumberInput source="floor_count" label={false} size="small" />
    </PropertyFormLayout>
  ),
};

/**
 * Required inputs — `validate={required()}` (or an explicit `isRequired`) re-appends the `*`
 * marker onto the resolved label, exactly like React Admin's own `<Labeled>`.
 */
export const RequiredField: Story = {
  args: {columns: 1},
  render: (args) => (
    <PropertyFormLayout {...args}>
      <TextInput source="address" validate={required()} size="small" />
      <NumberInput source="area" size="small" />
    </PropertyFormLayout>
  ),
};

/**
 * A single wide column — each label sits beside its input (the same width-driven `auto`
 * orientation `PropertyList` uses for read panels), contrasted with the narrower stacked columns
 * of the Playground above.
 */
export const Inline: Story = {
  args: {columns: 1},
  render: (args) => (
    <PropertyFormLayout {...args}>
      <TextInput source="address" validate={required()} size="small" />
      <ChoicesInput source="type" choices={PROPERTY_TYPES} size="small" />
      <BooleanInput source="residential" size="small" />
    </PropertyFormLayout>
  ),
};

/**
 * Inputs that depend on other form values go inside a `<FormDataConsumer>`. Whatever it returns is
 * laid out as rows — here a fragment with two inputs — and nothing while its condition is false.
 * Switch "Residential" off to hide the floor inputs.
 */
export const ConditionalInputs: Story = {
  args: {columns: 1},
  render: (args) => (
    <PropertyFormLayout {...args}>
      <TextInput source="address" size="small" />
      <BooleanInput source="residential" size="small" />
      <FormDataConsumer>
        {({formData}) =>
          formData.residential && (
            <>
              <NumberInput source="floor_number" size="small" />
              <NumberInput source="floor_count" size="small" />
            </>
          )
        }
      </FormDataConsumer>
    </PropertyFormLayout>
  ),
};

/**
 * Density — `compact` (default) keeps the tight form spacing; `standard` and `comfortable` widen
 * the row gap, the same semantics `PropertyList` and `DataTable` share.
 */
export const Densities: Story = {
  render: () => (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 4}}>
      {(['compact', 'standard', 'comfortable'] as const).map((density) => (
        <Box key={density}>
          <Box sx={{mb: 1, color: 'text.secondary', fontSize: 13}}>{density}</Box>
          <PropertyFormLayout columns={1} density={density}>
            <TextInput source="address" validate={required()} size="small" />
            <NumberInput source="area" size="small" />
          </PropertyFormLayout>
        </Box>
      ))}
    </Box>
  ),
};
