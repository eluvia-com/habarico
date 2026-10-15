import React from 'react';
import {box, fd} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaObjectBox} from './SchemaObjectBox';

// `dimensions` is the fixture's nested-object field: `{width, height, depth}` declared as the
// field's `properties`. The box reads those properties out of the method schema — it is not given
// them — which is why `object.target` must name a field that actually has them.
const objectBox = (overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({
    name: 'dimensions_box',
    type: 'object',
    label: 'Dimensions',
    object: {target: 'dimensions'},
    boxes: [fd('width'), fd('height'), fd('depth')],
    ...overrides,
  });

/**
 * The **nested-object container** — renders the properties of one object-typed field as if they
 * were fields of the record, with every source resolved *inside* that object (`dimensions.width`,
 * not `width`).
 *
 * Three things decide what it does:
 *
 * - **`object.target`** names the field. The box looks that field up in the method schema and
 *   renders **nothing at all** if it is missing or carries no `properties` — an object box is a
 *   view onto a declared nested structure, never a free-form group.
 * - **Read vs. write** is not only the box's own flag: `SchemaObjectBox` splits into
 *   `SchemaReadonlyObjectBox` / `SchemaWriteableObjectBox` on the *view's* `readOnly` **or** the
 *   target field's `readOnly`. A writable box inside a `show` view is still read-only.
 * - **Children** are field descriptors naming the object's own properties.
 *
 * The writable branch is what adds and clears the nested value, so an absent object can be filled
 * in and emptied again.
 */
const meta = {
  title: 'schema/boxes/SchemaObjectBox',
  component: SchemaObjectBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The nested object, writable. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={objectBox()} />,
};

/**
 * The two branches side by side. `readOnly` picks `SchemaReadonlyObjectBox`; the writable branch
 * renders inputs and owns the add / clear affordances for the nested value.
 */
export const ReadOnlyAndWritable: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaObjectBox — readOnly vs. writable'}>
      <SchemaBox isRoot schema={objectBox({name: 'ro', label: 'readOnly: true', readOnly: true})} />
      <SchemaBox isRoot schema={objectBox({name: 'rw', label: 'readOnly: false'})} />
    </ShowcaseStack>
  ),
};

/**
 * The record carries no `dimensions` object. The writable box offers to create one; the read-only
 * box has nothing to show.
 */
export const EmptyValue: Story = {
  parameters: {schemaStory: {record: {id: 1, name: 'Mechanical Keyboard K2'}}},
  render: () => (
    <ShowcaseStack title={'SchemaObjectBox — absent value'}>
      <SchemaBox isRoot schema={objectBox({name: 'empty_rw', label: 'writable'})} />
      <SchemaBox isRoot schema={objectBox({name: 'empty_ro', label: 'readOnly', readOnly: true})} />
    </ShowcaseStack>
  ),
};

/**
 * `object.target` naming a field that does not exist — or one without `properties`. The box renders
 * nothing rather than throwing, so a schema that drifts degrades quietly instead of breaking a view.
 */
export const UnknownTarget: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaObjectBox — target without properties → renders nothing'}>
      <SchemaBox isRoot schema={objectBox({name: 'unknown', object: {target: 'not_a_field'}})} />
      <SchemaBox isRoot schema={objectBox({name: 'flat', object: {target: 'name'}})} />
    </ShowcaseStack>
  ),
};
