import React from 'react';
import {INLINE_ACTION, box, fd} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import {SchemaFormActions} from '@schema/components/views/SchemaFormActions';
import {SchemaListActions} from '@schema/components/views/SchemaListActions';
import {SchemaShowBottomActions} from '@schema/components/views/SchemaShowBottomActions';
import {SchemaViewTitle} from '@schema/components/views/SchemaViewTitle';
import {SchemaViewToolbarActions} from '@schema/components/views/SchemaViewToolbarActions';
import type {ActionDescriptor, ViewSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';

const ACTIONS: ActionDescriptor[] = [{name: 'edit'}, {name: 'archive'}];

const DETAIL_BOX = box({name: 'detail', type: 'simple', boxes: [fd('name'), fd('sku')]});

const showView = (overrides: Partial<ViewSchema> = {}): ViewSchema => ({
  name: 'show',
  type: 'show',
  isDetail: true,
  label: 'Product',
  endpoint: {method: 'get'},
  detail: {box: DETAIL_BOX},
  ...overrides,
});

const listView = (overrides: Partial<ViewSchema> = {}): ViewSchema => ({
  name: 'list',
  type: 'list',
  isDetail: false,
  endpoint: {method: 'get'},
  list: {},
  ...overrides,
});

const editView = (overrides: Partial<ViewSchema> = {}): ViewSchema => ({
  name: 'edit',
  type: 'edit',
  isDetail: true,
  label: 'Edit product',
  endpoint: {method: 'put'},
  detail: {box: DETAIL_BOX},
  ...overrides,
});

/**
 * **The five view slots** — the pieces a generated view puts around its box tree. None of them takes
 * configuration from its caller: each reads the current `ViewSchema` out of `ViewSchemaContext` and
 * renders what that schema asks for, which is why they are documented together rather than one by
 * one.
 *
 * | Slot | Reads | Renders |
 * | --- | --- | --- |
 * | `SchemaViewTitle` | `viewSchema.label` | the label, or — in an overlay with a record — the record's `meta.repr` |
 * | `SchemaViewToolbarActions` | `detail.toolbarActions` | the view's toolbar buttons |
 * | `SchemaFormActions` | `detail.bottomActions` | those buttons, **or a `SaveButton` when none are declared** |
 * | `SchemaShowBottomActions` | `detail.bottomActions` | those buttons, or **nothing** |
 * | `SchemaListActions` | `list.listActions` | the datagrid tools (column selector) plus any declared actions |
 *
 * The two bottom-action slots are the pair worth comparing: they read the **same** schema key and
 * differ only in the fallback. A form must always offer a way to save, so `SchemaFormActions` falls
 * back to a `SaveButton`; a show view has nothing to save, so `SchemaShowBottomActions` renders
 * nothing. Putting the form slot on a read-only view is therefore how a stray Save button appears
 * where none belongs.
 *
 * `SchemaViewTitle`'s overlay fallback is inert without a record, so a list or create view — which
 * has no single record — renders no title from it.
 */
const meta = {
  title: 'schema/views/ViewSlots',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: {disable: true},
    schemaStory: {viewSchema: showView({detail: {box: DETAIL_BOX, toolbarActions: ACTIONS}})},
  },
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** `SchemaViewTitle` — a labelled view shows its label. */
export const ViewTitle: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaViewTitle'}>
      <Showcase caption={"viewSchema.label: 'Product'"}>
        <SchemaViewTitle />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** `SchemaViewToolbarActions` — the view's own toolbar buttons, from `detail.toolbarActions`. */
export const ViewToolbarActions: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaViewToolbarActions'}>
      <Showcase caption={'detail.toolbarActions: [edit, archive]'}>
        <SchemaViewToolbarActions />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * **The fallback difference.** Both slots read `detail.bottomActions`; with the key unset the form
 * slot still renders a `SaveButton` and the show slot renders nothing at all.
 */
export const BottomActionFallbacks: Story = {
  parameters: {schemaStory: {viewSchema: editView()}},
  render: () => (
    <ShowcaseStack title={'Bottom actions — SchemaFormActions vs. SchemaShowBottomActions'}>
      <Showcase caption={'SchemaFormActions, bottomActions unset → SaveButton'}>
        <SchemaFormActions />
      </Showcase>
      <Showcase caption={'SchemaShowBottomActions, bottomActions unset → nothing'}>
        <SchemaShowBottomActions />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** With `bottomActions` declared, both slots render the same buttons. */
export const BottomActionsDeclared: Story = {
  parameters: {
    schemaStory: {
      viewSchema: editView({detail: {box: DETAIL_BOX, bottomActions: [INLINE_ACTION]}}),
    },
  },
  render: () => (
    <ShowcaseStack title={'Bottom actions — declared'}>
      <Showcase caption={'SchemaFormActions'}>
        <SchemaFormActions />
      </Showcase>
      <Showcase caption={'SchemaShowBottomActions'}>
        <SchemaShowBottomActions />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `SchemaListActions` — the datagrid tools always render; declared `list.listActions` are added
 * next to them, icon-only.
 */
export const ListActions: Story = {
  parameters: {schemaStory: {viewSchema: listView(), list: true}},
  render: () => (
    <ShowcaseStack title={'SchemaListActions'}>
      <Showcase caption={'list.listActions unset → the datagrid tools alone'}>
        <SchemaListActions />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** The same slot with an action declared on the list view. */
export const ListActionsDeclared: Story = {
  parameters: {
    schemaStory: {viewSchema: listView({list: {listActions: [INLINE_ACTION]}}), list: true},
  },
  render: () => <SchemaListActions />,
};
