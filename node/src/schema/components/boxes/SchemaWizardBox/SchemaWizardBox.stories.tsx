import React from 'react';
import {box, fd} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import type {BoxItem, BoxSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaWizardBox} from './SchemaWizardBox';

const step = (name: string, label: string, boxes: BoxItem[]): BoxSchema =>
  box({name, type: 'tab-item', label, boxes});

const STEPS: BoxSchema[] = [
  step('identity', 'Identity', [fd('name'), fd('sku')]),
  step('pricing', 'Pricing', [fd('price'), fd('stock')]),
  step('contact', 'Contact', [fd('support_email'), fd('phone')]),
];

const wizardBox = (boxes: BoxItem[], overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: 'wizard', type: 'wizard', boxes, ...overrides});

/**
 * The **stepped form** — the same "box children are panes" idea as `SchemaTabBox`, but linear: a
 * `Stepper` plus Previous / Next instead of a free tab strip.
 *
 * What makes it a wizard rather than tabs:
 *
 * - **`wizard.validateSteps`** (default `true`) runs the form's validation for the *current step's*
 *   fields before it lets you move on. The step's field names are collected by walking its box tree
 *   (`collectFieldNames`), descending through layout boxes and into object boxes, and treating an
 *   array box as one field — a `list` or `gallery` box contributes nothing, since neither is a form
 *   field.
 * - **`wizard.showToolbarNavigation`** (default `true`) puts the navigation in the view toolbar
 *   rather than the box's own footer.
 * - **Card chrome** is evaluated like the grid box's, minus the toolbar: a `label` or `collapsible`
 *   turns it on, an explicit `card` wins either way — but toolbar actions do **not**, because they
 *   sit next to the stepper rather than in a card header.
 *
 * Like the tab box it keeps only box children; a stray field descriptor among the steps is dropped.
 */
const meta = {
  title: 'schema/boxes/SchemaWizardBox',
  component: SchemaWizardBox,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Three steps, navigation in the box footer. */
export const Default: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={wizardBox(STEPS, {name: 'default', wizard: {showToolbarNavigation: false}})}
    />
  ),
};

/**
 * `validateSteps` on vs. off. With it on, a step whose required fields are empty will not let you
 * advance; with it off the stepper is free navigation and validation only happens on submit.
 */
export const StepValidation: Story = {
  parameters: {schemaStory: {record: {id: 1}}},
  render: () => (
    <ShowcaseStack title={'SchemaWizardBox — validateSteps'}>
      <SchemaBox
        isRoot
        schema={wizardBox(STEPS, {
          name: 'validated',
          label: 'validateSteps: true',
          wizard: {validateSteps: true, showToolbarNavigation: false},
        })}
      />
      <SchemaBox
        isRoot
        schema={wizardBox(STEPS, {
          name: 'free',
          label: 'validateSteps: false',
          wizard: {validateSteps: false, showToolbarNavigation: false},
        })}
      />
    </ShowcaseStack>
  ),
};

/** A single step — the stepper still renders, so the shape stays recognisable. */
export const SingleStep: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={wizardBox([STEPS[0]], {name: 'single', wizard: {showToolbarNavigation: false}})}
    />
  ),
};

/**
 * A step holding a nested layout instead of a flat field list — a step is an ordinary box, so it
 * takes a grid the same way a tab item does.
 */
export const NestedLayout: Story = {
  render: () => (
    <SchemaBox
      isRoot
      schema={wizardBox(
        [
          box({
            name: 'overview',
            type: 'tab-item',
            label: 'Overview',
            boxes: [
              box({
                name: 'overview_grid',
                type: 'grid',
                boxes: [
                  box({name: 'g1', type: 'simple', label: 'Identity', boxes: [fd('name')]}),
                  box({name: 'g2', type: 'simple', label: 'Pricing', boxes: [fd('price')]}),
                ],
              }),
            ],
          }),
          STEPS[2],
        ],
        {name: 'nested', wizard: {showToolbarNavigation: false}}
      )}
    />
  ),
};
