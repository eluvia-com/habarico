import React from 'react';
import {
  CATEGORIES_RESOURCE,
  CATEGORY_METHOD,
  CATEGORY_RECORD,
  CATEGORY_RESOURCE_SCHEMA,
  INLINE_ACTION,
  PRODUCTS_RESOURCE,
  SUMMARY_FIELDS,
  box,
  fd,
  referenceTo,
  rootWrap,
} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {SchemaImagesBox} from '@schema/components/boxes/SchemaImagesBox';
import type {AnyActionDescriptor, BoxSchema, ListBoxParameters} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';

// Every story mounts on a category. Its only action is `show`; products have `show`, `edit`,
// `create` and `archive`.
const CATEGORY_CONTEXT = {
  schemaStory: {
    resource: CATEGORIES_RESOURCE,
    record: CATEGORY_RECORD,
    schema: CATEGORY_RESOURCE_SCHEMA,
    methodSchema: CATEGORY_METHOD,
  },
};

// What a backend sends for a row slot its author left unset.
const ROW_DEFAULTS: AnyActionDescriptor[] = [{type: 'default_actions', scope: 'detail'}];

// The category's products, as a backend addresses them from a box header.
const PRODUCTS_OF_CATEGORY = referenceTo(PRODUCTS_RESOURCE, {
  params: {
    _target: JSON.stringify({category_id: CATEGORY_RECORD.id}),
    _source: JSON.stringify({[CATEGORIES_RESOURCE]: CATEGORY_RECORD.id}),
  },
});

type CollectionSlots = {
  /** The box header slot (`box.toolbarActions`). */
  toolbarActions?: AnyActionDescriptor[];
  /** The datagrid / images toolbar slot (`list.listActions`). */
  listActions?: AnyActionDescriptor[];
};

const productsList = ({listActions}: CollectionSlots): ListBoxParameters => ({
  reference: referenceTo(PRODUCTS_RESOURCE),
  target: 'category_id',
  rowActions: ROW_DEFAULTS,
  ...(listActions ? {listActions} : {}),
});

// A list box of the category's products, nested in a root box as in a detail view.
const productsListBox = (name: string, slots: CollectionSlots = {}): BoxSchema =>
  rootWrap(
    name,
    box({
      name,
      type: 'list',
      label: 'Products',
      card: true,
      readOnly: true,
      ...(slots.toolbarActions ? {toolbarActions: slots.toolbarActions} : {}),
      list: productsList(slots),
      boxes: SUMMARY_FIELDS,
    })
  );

// The same collection as an image grid. `defaultBoxProvider` has no `images` type, so the story
// mounts `SchemaImagesBox` directly.
const productsImagesBox = (name: string, slots: CollectionSlots = {}): BoxSchema =>
  box({
    name,
    type: 'list',
    label: 'Product photos',
    card: true,
    readOnly: true,
    ...(slots.toolbarActions ? {toolbarActions: slots.toolbarActions} : {}),
    list: productsList(slots),
    boxes: [fd('photo'), fd('name'), fd('price')],
  });

const categorySummaryBox = (name: string, toolbarActions?: AnyActionDescriptor[]): BoxSchema =>
  rootWrap(
    name,
    box({
      name,
      type: 'simple',
      label: 'Category',
      card: true,
      ...(toolbarActions ? {toolbarActions} : {}),
      boxes: [fd('name'), fd('parent_id')],
    })
  );

// Two steps of category fields for the tab and wizard boxes.
const STEPS: BoxSchema[] = [
  box({name: 'identity', label: 'Identity', type: 'simple', boxes: [fd('name')]}),
  box({name: 'placement', label: 'Placement', type: 'simple', boxes: [fd('parent_id')]}),
];

const navigationBox =
  (type: 'tab' | 'wizard') =>
  (name: string, overrides: Partial<BoxSchema> = {}): BoxSchema =>
    rootWrap(name, box({name, type, boxes: STEPS, ...overrides}));

const detailTabBox = navigationBox('tab');
const detailWizardBox = navigationBox('wizard');

/**
 * Where each box type shows its actions.
 *
 * | Schema key           | Shown in         | Looked up in                                   |
 * |----------------------|------------------|------------------------------------------------|
 * | `box.toolbarActions` | box header       | the parent record, or the entry's `reference`  |
 * | `list.listActions`   | datagrid toolbar | the listed resource                            |
 * | `list.rowActions`    | each row         | the listed resource                            |
 *
 * A named action shows only if that resource has it; otherwise the button is left out without an
 * error. An inline action always shows, and an unset slot stays empty.
 */
const meta = {
  title: 'schema/boxes/BoxActions',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: {disable: true},
    docs: {canvas: {sourceState: 'none'}},
    ...CATEGORY_CONTEXT,
  },
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * The rows show Detail and Edit, which `default_actions` expands into. The category has no `create`,
 * so the header needs a reference to the products to show it.
 */
export const ListBox: Story = {
  render: () => (
    <>
      <ShowcaseStack title={'SchemaListBox — box header (box.toolbarActions)'}>
        <Showcase caption={"[create] with a reference to the category's products → shown"}>
          <SchemaBox
            isRoot
            schema={productsListBox('header_reference', {
              toolbarActions: [{name: 'create', reference: PRODUCTS_OF_CATEGORY}],
            })}
          />
        </Showcase>
        <Showcase caption={'[create] without a reference → hidden, the category has no create'}>
          <SchemaBox
            isRoot
            schema={productsListBox('header_bare', {toolbarActions: [{name: 'create'}]})}
          />
        </Showcase>
        <Showcase caption={'[show] → shown, the category has it'}>
          <SchemaBox
            isRoot
            schema={productsListBox('header_parent', {toolbarActions: [{name: 'show'}]})}
          />
        </Showcase>
        <Showcase caption={'inline action → always shown'}>
          <SchemaBox
            isRoot
            schema={productsListBox('header_inline', {toolbarActions: [INLINE_ACTION]})}
          />
        </Showcase>
      </ShowcaseStack>
      <ShowcaseStack title={'SchemaListBox — datagrid toolbar (list.listActions)'}>
        <Showcase caption={"[{type: 'default_actions', scope: 'list'}] → New product"}>
          <SchemaBox
            isRoot
            schema={productsListBox('toolbar_defaults', {
              listActions: [{type: 'default_actions', scope: 'list'}],
            })}
          />
        </Showcase>
        <Showcase caption={'[create] → shown, products have it'}>
          <SchemaBox
            isRoot
            schema={productsListBox('toolbar_named', {listActions: [{name: 'create'}]})}
          />
        </Showcase>
        <Showcase caption={'inline action → always shown'}>
          <SchemaBox
            isRoot
            schema={productsListBox('toolbar_inline', {listActions: [INLINE_ACTION]})}
          />
        </Showcase>
      </ShowcaseStack>
    </>
  ),
};

/** The header looks actions up in the category, which only has `show`. */
export const SimpleBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaSimpleBox — box header (box.toolbarActions)'}>
      <Showcase caption={'[show] → shown, the category has it'}>
        <SchemaBox isRoot schema={categorySummaryBox('simple_show', [{name: 'show'}])} />
      </Showcase>
      <Showcase caption={'[create] → hidden, the category has no create'}>
        <SchemaBox isRoot schema={categorySummaryBox('simple_create', [{name: 'create'}])} />
      </Showcase>
      <Showcase caption={'inline action → always shown'}>
        <SchemaBox isRoot schema={categorySummaryBox('simple_inline', [INLINE_ACTION])} />
      </Showcase>
      <Showcase caption={'unset → no actions'}>
        <SchemaBox isRoot schema={categorySummaryBox('simple_none')} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * Without a card the actions sit to the right of the tabs. A `label` turns the box into a card and
 * moves them to its header.
 */
export const TabBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaTabBox — action slots'}>
      <Showcase caption={'no card + [show] → next to the tabs'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_show', {card: false, toolbarActions: [{name: 'show'}]})}
        />
      </Showcase>
      <Showcase caption={'with a label → in the card header'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_card', {
            label: 'Category detail',
            toolbarActions: [INLINE_ACTION],
          })}
        />
      </Showcase>
      <Showcase caption={'no card, no actions'}>
        <SchemaBox isRoot schema={detailTabBox('tab_plain', {card: false})} />
      </Showcase>
      <Showcase caption={'tab.showToolbarNavigation: true → step navigation in the footer'}>
        <SchemaBox
          isRoot
          schema={detailTabBox('tab_nav', {card: false, tab: {showToolbarNavigation: true}})}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * Header actions are placed as on the tab box. `bottomActions` go to the footer next to the step
 * navigation.
 */
export const WizardBox: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaWizardBox — action slots'}>
      <Showcase caption={'no card + [show] → next to the stepper'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_show', {card: false, toolbarActions: [{name: 'show'}]})}
        />
      </Showcase>
      <Showcase caption={'with a label → in the card header'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_card', {
            label: 'Category wizard',
            toolbarActions: [INLINE_ACTION],
          })}
        />
      </Showcase>
      <Showcase caption={'bottomActions: [inline] → in the footer'}>
        <SchemaBox
          isRoot
          schema={detailWizardBox('wizard_bottom', {card: false, bottomActions: [INLINE_ACTION]})}
        />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** The same slots as the list box, above an image grid. */
export const ImagesBox: Story = {
  render: () => (
    <>
      <ShowcaseStack title={'SchemaImagesBox — box header (box.toolbarActions)'}>
        <Showcase caption={"[create] with a reference to the category's products → shown"}>
          <SchemaImagesBox
            isRoot
            schema={productsImagesBox('img_header_reference', {
              toolbarActions: [{name: 'create', reference: PRODUCTS_OF_CATEGORY}],
            })}
          />
        </Showcase>
        <Showcase caption={'[create] without a reference → hidden, the category has no create'}>
          <SchemaImagesBox
            isRoot
            schema={productsImagesBox('img_header_bare', {toolbarActions: [{name: 'create'}]})}
          />
        </Showcase>
      </ShowcaseStack>
      <ShowcaseStack title={'SchemaImagesBox — images toolbar (list.listActions)'}>
        <Showcase caption={"[{type: 'default_actions', scope: 'list'}] → New product"}>
          <SchemaImagesBox
            isRoot
            schema={productsImagesBox('img_toolbar_defaults', {
              listActions: [{type: 'default_actions', scope: 'list'}],
            })}
          />
        </Showcase>
        <Showcase caption={'inline action → always shown'}>
          <SchemaImagesBox
            isRoot
            schema={productsImagesBox('img_toolbar_inline', {listActions: [INLINE_ACTION]})}
          />
        </Showcase>
      </ShowcaseStack>
    </>
  ),
};
