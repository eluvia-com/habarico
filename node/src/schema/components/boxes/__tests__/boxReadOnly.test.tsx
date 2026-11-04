import React from 'react';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {PRODUCT_METHOD, PRODUCT_RECORD, box, fd} from '@schema/components/_data';
import {SchemaStoryProviders} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {BoxSchema, FieldSchema, MethodSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';

/**
 * `read_only` on a **box** closes that box and everything under it, in an `edit` / `create` view
 * too — the view's own mode is only one of the sources. The assertion throughout is the absence of
 * the row's inputs: a closed box renders values, so it renders no `<input>` for them.
 *
 * Rendered through the real provider ring (`SchemaStoryProviders`, in `form` mode = the fixture's
 * `edit` view), so what each box resolves — target field schema, box dispatch, row sources — is the
 * library's own and not a stub. The design theme has to be supplied here: in Storybook the global
 * decorator does it, and `FormTable` reads palette values off it.
 */
const renderInEditView = (schema: BoxSchema, methodSchema: MethodSchema = PRODUCT_METHOD) =>
  render(
    <ThemeProvider theme={createLightTheme()}>
      <SchemaStoryProviders form methodSchema={methodSchema} record={RECORD}>
        <SchemaBox isRoot schema={schema} />
      </SchemaStoryProviders>
    </ThemeProvider>
  );

/** Inputs are addressed by their form source, so this says which cells are editable, not just how many. */
const inputNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('input'))
    .map((input) => input.getAttribute('name'))
    .filter((name): name is string => Boolean(name));

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
        enum: ['Gift wrapping', 'Extended warranty', 'Other'].map((value) => ({
          value,
          label: value,
        })),
      },
      {name: 'note', type: 'string', format: 'text', label: 'Note'},
    ],
  },
};

const RECORD = {...PRODUCT_RECORD, features: [{feature_type: 'Gift wrapping'}]};
const FEATURES_METHOD: MethodSchema = {fields: [...PRODUCT_METHOD.fields, FEATURES_FIELD]};

const simpleBox = (over: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: 'basics', type: 'simple', label: 'Basics', boxes: [fd('sku'), fd('stock')], ...over});

const arrayBox = (over: Partial<BoxSchema> = {}, fields = [fd('sku'), fd('size'), fd('stock')]) =>
  box({
    name: 'variants_box',
    type: 'array',
    label: 'Variants',
    array: {target: 'variants', inline: true},
    boxes: fields,
    ...over,
  });

const objectBox = (over: Partial<BoxSchema> = {}): BoxSchema =>
  box({
    name: 'dimensions_box',
    type: 'object',
    label: 'Dimensions',
    object: {target: 'dimensions'},
    boxes: [fd('width'), fd('height'), fd('depth')],
    ...over,
  });

const choicesBox = (over: Partial<BoxSchema> = {}): BoxSchema =>
  box({
    name: 'features',
    type: 'array',
    label: 'Features',
    card: true,
    array: {
      target: 'features',
      inline: true,
      listed: {fieldName: 'feature_type', otherValues: ['Other']},
    },
    boxes: [fd('feature_type'), fd('note')],
    ...over,
  });

describe('a box that declares read_only in an edit view', () => {
  it('renders a simple box as values, not inputs', async () => {
    const writeable = renderInEditView(simpleBox());
    await screen.findByText('Basics');
    expect(inputNames(writeable.container)).toEqual(['sku', 'stock']);
    writeable.unmount();

    const {container} = renderInEditView(simpleBox({readOnly: true}));
    await screen.findByText('Basics');
    expect(inputNames(container)).toEqual([]);
  });

  it('closes a nested box that declares read_only: false', async () => {
    // The shape the backends emit: the flag sits on the outer box and its children keep the
    // `read_only: false` default. The scope only ever turns on, so they stay closed.
    const {container} = renderInEditView(
      box({
        name: 'outer',
        type: 'simple',
        label: 'Outer',
        readOnly: true,
        boxes: [simpleBox({readOnly: false})],
      })
    );
    await screen.findByText('Outer');
    expect(inputNames(container)).toEqual([]);
  });

  it('renders an inline array box as a datagrid, not a form table', async () => {
    const writeable = renderInEditView(arrayBox());
    await screen.findByText('Variants');
    expect(inputNames(writeable.container)).toEqual([
      'variants.0.sku',
      'variants.0.size',
      'variants.0.stock',
      'variants.1.sku',
      'variants.1.size',
      'variants.1.stock',
    ]);
    writeable.unmount();

    const {container} = renderInEditView(arrayBox({readOnly: true}));
    await screen.findByText('Variants');
    expect(inputNames(container)).toEqual([]);
    expect(container.querySelector('.RaArrayInput-root')).not.toBeInTheDocument();
  });

  it('renders a non-inline array box as nested panel rows', async () => {
    const {container} = renderInEditView(
      arrayBox({readOnly: true, array: {target: 'variants', inline: false}})
    );
    await screen.findByText('Variants');
    expect(inputNames(container)).toEqual([]);
  });

  it('renders an object box as values', async () => {
    const writeable = renderInEditView(objectBox());
    await screen.findByText('Dimensions');
    expect(inputNames(writeable.container)).toEqual([
      'dimensions.width',
      'dimensions.height',
      'dimensions.depth',
    ]);
    writeable.unmount();

    const {container} = renderInEditView(objectBox({readOnly: true}));
    await screen.findByText('Dimensions');
    expect(inputNames(container)).toEqual([]);
  });

  it('drops the checklist of a listed array box', async () => {
    const writeable = renderInEditView(choicesBox(), FEATURES_METHOD);
    await screen.findByText('Features');
    expect(writeable.container.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(
      0
    );
    writeable.unmount();

    const {container} = renderInEditView(choicesBox({readOnly: true}), FEATURES_METHOD);
    await screen.findByText('Features');
    expect(inputNames(container)).toEqual([]);
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  });
});

describe('a read-only field inside a writeable array box', () => {
  it('renders that column as a value and leaves the others editable', async () => {
    const {container} = renderInEditView(
      arrayBox({}, [fd('sku', {readOnly: true}), fd('size'), fd('stock')])
    );
    await screen.findByText('Variants');

    expect(inputNames(container)).toEqual([
      'variants.0.size',
      'variants.0.stock',
      'variants.1.size',
      'variants.1.stock',
    ]);
  });
});
