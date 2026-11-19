import React from 'react';
import {SchemaStoryProviders} from '@schema/components/_storyKit';
import type {FieldDescriptor, FieldSchema, MethodSchema, ViewSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaFieldGroup} from './SchemaFieldGroup';

// `area` shows only while `show_area` is on. The query reads `data.<field>`, which follows the live
// form values; `record.<field>` would only ever see the loaded record.
const FIELDS: FieldSchema[] = [
  {name: 'address', type: 'string', label: 'Address'},
  {name: 'show_area', type: 'boolean', label: 'Show the area field'},
  {
    name: 'area',
    type: 'number',
    label: 'Area',
    options: {dynamicRender: {showQuery: 'data.show_area == true'}},
  },
];

const FIELD_DESCRIPTORS: FieldDescriptor[] = FIELDS.map((field) => ({
  type: 'field',
  name: field.name,
}));

const METHOD_SCHEMA: MethodSchema = {fields: FIELDS};

const viewSchema = (readOnly: boolean): ViewSchema => ({
  name: readOnly ? 'show' : 'edit',
  // `useViewSchemaContext` derives `readOnly` from the view type.
  type: readOnly ? 'show' : 'edit',
  isDetail: true,
  endpoint: {method: 'get'},
});

type StoryArgs = {
  /** Read view — the same schema renders through `SchemaField` instead of `SchemaInput`. */
  readOnly: boolean;
  /** Seeds `show_area`, so the story can start with the conditional field already hidden. */
  showArea: boolean;
};

// The record only seeds the form on mount, so a changed arg remounts the ring.
const FieldGroupStory = ({readOnly, showArea}: StoryArgs) => (
  <SchemaStoryProviders
    key={`${readOnly}-${showArea}`}
    record={{id: 1, address: 'Jihlavská 521/62', show_area: showArea, area: 50}}
    methodSchema={METHOD_SCHEMA}
    viewSchema={viewSchema(readOnly)}
    form
    width={420}
  >
    <SchemaFieldGroup fields={FIELD_DESCRIPTORS} />
  </SchemaStoryProviders>
);

/**
 * Lays a box's fields out as label + value rows: inputs in an edit view, values in a read view. A
 * field whose schema carries `options.dynamicRender.showQuery` shows only while the query holds —
 * its whole row, label included. Toggle "Show the area field" to show or hide "Area".
 */
const meta = {
  title: 'schema/boxes/SchemaFieldGroup',
  tags: ['autodocs'],
  parameters: {layout: 'padded', docs: {canvas: {sourceState: 'none'}}},
  argTypes: {
    readOnly: {control: 'boolean'},
    showArea: {control: 'boolean'},
  },
  args: {readOnly: false, showArea: true},
  render: (args) => <FieldGroupStory {...args} />,
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<StoryArgs>;

/** Edit view — "Area" follows the "Show the area field" switch. */
export const ConditionalField: Story = {};

/** Read view — "Area" follows the record's `show_area`; set it with the `showArea` control. */
export const ConditionalFieldReadOnly: Story = {
  args: {readOnly: true},
};
