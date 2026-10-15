import React from 'react';
import {PRODUCT_METHOD, PRODUCT_RECORD, box, fd} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxSchema, FieldSchema, ListedOptions, MethodSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaChoicesArrayBox} from './SchemaChoicesArrayBox';

const FEATURE_TYPES = [
  'Warranty extension',
  'Gift wrapping',
  'Engraving',
  'Express shipping',
  'Other',
];

// The array field the checklist is built from. `feature_type` carries the enum — one fixed row per
// value — and `note` is the second cell, only really meaningful on the free ("other") rows.
const FEATURES_FIELD: FieldSchema = {
  name: 'features',
  type: 'array',
  label: 'Features',
  items: {
    name: 'features',
    type: 'object',
    properties: [
      {
        name: 'feature_type',
        type: 'string',
        format: 'choices',
        label: 'Feature',
        enum: FEATURE_TYPES.map((value) => ({value, label: value})),
      },
      {name: 'note', type: 'string', format: 'text', label: 'Note'},
    ],
  },
};

// The fixture's product method schema plus the checklist field — the box resolves its target out of
// the method schema (via `FieldSchemaMapContext`, which falls back to it).
const featuresMethod = (overrides: Partial<FieldSchema> = {}): MethodSchema => ({
  fields: [...PRODUCT_METHOD.fields, {...FEATURES_FIELD, ...overrides}],
});

const featuresBox = (
  overrides: Partial<BoxSchema> = {},
  listed: Partial<ListedOptions> = {},
  helpText = false
): BoxSchema =>
  box({
    name: 'features',
    type: 'array',
    label: 'Features',
    // The checklist renders on a `Panel` of its own, like every other box on a detail view.
    card: true,
    array: {
      target: 'features',
      inline: true,
      listed: {fieldName: 'feature_type', otherValues: ['Other'], ...listed},
    },
    boxes: [
      fd('feature_type'),
      {...fd('note'), ...(helpText && {helpText: 'Optional extra detail'})},
    ],
    ...overrides,
  });

const withFeatures = (features: Record<string, unknown>[], fieldOverrides = {}) => ({
  schemaStory: {
    record: {...PRODUCT_RECORD, features},
    methodSchema: featuresMethod(fieldOverrides),
  },
});

/**
 * The **`listed` variant of the array box** — an enum checklist instead of a free list of rows.
 * `defaultBoxProvider` routes an array box here as soon as `array.listed` is set; without it the
 * same schema renders as the plain `SchemaArrayBox`.
 *
 * What `listed` changes:
 *
 * - **`listed.fieldName`** names the property inside the array item that carries the enum. Every
 *   value of that enum gets a **fixed row with a checkbox** — checking one appends an array item,
 *   unchecking removes it. There is no "add row" for these; the rows exist whether or not they are
 *   selected.
 * - **`listed.otherValues`** lists the enum values that mean "something else". Those get no fixed
 *   row — instead the Add button appends a **free row**, whose choices are the values *already in
 *   use*, so anything still unchecked stays reachable only through its own checklist row.
 * - **A checklist row toggles on click anywhere**, not just on the checkbox — except when the click
 *   lands in one of the row's own inputs, buttons or links, so editing a row cannot untick it. Free
 *   rows have no choice to toggle and ignore the gesture entirely (HAB-879).
 * - **Only a free row carries a delete action.** On a checklist row the checkbox already is one.
 *
 * **Read-only falls back to `SchemaArrayBox`** — a checklist has nothing to toggle in a read view —
 * and the fallback is driven by the *view* or the *target field*, not by `schema.readOnly`.
 *
 * Rows render through the design `FormTable`, so the row card, the row count and the Add / Clear
 * list footer are its.
 */
const meta = {
  title: 'schema/boxes/SchemaChoicesArrayBox',
  component: SchemaChoicesArrayBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}, ...withFeatures([])},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Nothing selected yet — one unchecked row per enum value, and Add for the free `Other` rows. */
export const Default: Story = {
  render: () => <SchemaBox isRoot schema={featuresBox()} />,
};

/**
 * A record that already carries values: two checked checklist rows plus a free `Other` row with its
 * own note. The free row is the only one with a delete button — unchecking a fixed row is what
 * removes its value.
 */
export const Prefilled: Story = {
  parameters: withFeatures([
    {feature_type: 'Gift wrapping'},
    {feature_type: 'Express shipping'},
    {feature_type: 'Other', note: 'Serial number sticker'},
  ]),
  render: () => <SchemaBox isRoot schema={featuresBox()} />,
};

/**
 * `array.inline` is the layout **inside** a row: the cells side by side, or stacked under each
 * other. Worth watching with `helpText` on — a taller sibling cell must not push the checkbox off
 * the row's centre, and switching it off must give the height back rather than leave an empty
 * helper row.
 */
export const RowLayout: Story = {
  parameters: withFeatures([{feature_type: 'Engraving', note: 'Initials'}]),
  render: () => (
    <ShowcaseStack title={'SchemaChoicesArrayBox — row layout'}>
      <Showcase caption={'inline: true — cells side by side'}>
        <SchemaBox isRoot schema={featuresBox({name: 'inline', label: 'inline: true'})} />
      </Showcase>
      <Showcase caption={'inline: false — cells stacked'}>
        <SchemaBox
          isRoot
          schema={featuresBox({
            name: 'stacked',
            label: 'inline: false',
            array: {
              target: 'features',
              inline: false,
              listed: {fieldName: 'feature_type', otherValues: ['Other']},
            },
          })}
        />
      </Showcase>
      <Showcase caption={'inline: true, with helpText on the second cell'}>
        <SchemaBox isRoot schema={featuresBox({name: 'help', label: 'helpText'}, {}, true)} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `listed.otherValues` empty — every enum value is a fixed row, so there is nothing to add and the
 * Add button is gone. `Other` becomes an ordinary checklist row like the rest.
 */
export const NoOtherValues: Story = {
  parameters: withFeatures([{feature_type: 'Other'}]),
  render: () => <SchemaBox isRoot schema={featuresBox({name: 'fixed'}, {otherValues: []})} />,
};

/**
 * The read-only fallback. The target field is marked `readOnly`, so the checklist is replaced by the
 * plain `SchemaArrayBox` — the selected items as rows, with no checkboxes and no Add.
 */
export const ReadOnly: Story = {
  parameters: withFeatures(
    [{feature_type: 'Gift wrapping'}, {feature_type: 'Other', note: 'Serial number sticker'}],
    {readOnly: true}
  ),
  render: () => <SchemaBox isRoot schema={featuresBox({name: 'ro'})} />,
};

/**
 * The same enum value twice. The first item claims the fixed checklist row (checked); the second
 * falls through to a free row, whose choices offer only the values *already in use* — a value not in
 * use yet is excluded, because it has a checklist row of its own to be checked in. So a duplicate is
 * reachable only through a free row, and only once the value is checked above.
 */
export const DuplicateValue: Story = {
  parameters: withFeatures([
    {feature_type: 'Warranty extension'},
    {feature_type: 'Warranty extension', note: 'Second unit'},
    {feature_type: 'Gift wrapping'},
  ]),
  render: () => <SchemaBox isRoot schema={featuresBox({name: 'dupe'})} />,
};
