import React from 'react';
import {INLINE_ACTION} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaFieldShell} from '@schema/components/_storyKit';
import type {ActionDescriptor} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaButtons} from './SchemaButtons';

// Named descriptors resolve against the record's own action schema; `products` declares
// show / edit / create / archive in the fixtures.
const NAMED: ActionDescriptor[] = [{name: 'show'}, {name: 'edit'}, {name: 'archive'}];

/**
 * Turns a list of **action descriptors** into a row of buttons — the component behind every action
 * slot in the layer (a box header, a view toolbar, a datagrid row).
 *
 * The part worth understanding is **resolution**. A descriptor renders only when it resolves, and
 * there are two ways it can:
 *
 * - It carries its own inline `action`, in which case it always renders; or
 * - its `name` is found in the **action schema of the resource whose context it renders in**.
 *
 * That second rule is why the same descriptor can appear in one slot and vanish in another: a box
 * header resolves against the parent record, a list slot against the referenced resource. When a
 * name does not resolve the descriptor is **dropped silently** — no button, no error. The
 * slot-by-slot consequences have their own dedicated story, `schema/boxes/BoxActions`.
 *
 * With no `descriptors` at all it **generates** them from the resource schema, filtered by `scope`
 * (`'detail'` for record actions, `'list'` for collection actions, `'all'` for both).
 *
 * Overflow is handled by `OverflowToolbar`: `maxVisibleButtons` (a number, or a per-breakpoint map
 * like `{xs: 1, lg: 3}`) is how many stay inline before the rest collapse into a `⋮` menu — the
 * trigger itself is never counted. Menu items always keep their labels even when the inline buttons
 * are `iconOnly`.
 */
const meta = {
  title: 'schema/buttons/SchemaButtons',
  component: SchemaButtons,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaFieldShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/**
 * **The resolution rule, visible.** All three rows are handed the same kind of descriptor list; only
 * the names differ. A name in the record's action schema renders, one that is not is dropped, and an
 * inline action always renders regardless.
 */
export const DescriptorResolution: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButtons — which descriptors resolve'}>
      <Showcase caption={"[{name: 'show'}, {name: 'edit'}] → both are product actions"}>
        <SchemaButtons
          descriptors={[{name: 'show'}, {name: 'edit'}]}
          size={'small'}
          variant={'contained'}
        />
      </Showcase>
      <Showcase caption={"[{name: 'not_an_action'}] → dropped, nothing renders"}>
        <SchemaButtons
          descriptors={[{name: 'not_an_action'}]}
          size={'small'}
          variant={'contained'}
        />
      </Showcase>
      <Showcase caption={'[inline action] → always renders, it carries its own action'}>
        <SchemaButtons descriptors={[INLINE_ACTION]} size={'small'} variant={'contained'} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/** Overflow: the same three buttons at decreasing `maxVisibleButtons`. */
export const Overflow: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButtons — maxVisibleButtons'}>
      {[3, 2, 1].map((max) => (
        <Showcase key={max} caption={`maxVisibleButtons: ${max}`}>
          <SchemaButtons
            descriptors={NAMED}
            maxVisibleButtons={max}
            size={'small'}
            variant={'contained'}
          />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};

/** Labels vs. icons — and a confirmed action, whose dialog comes from the schema. */
export const Appearance: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButtons — appearance'}>
      <Showcase caption={'labels (default)'}>
        <SchemaButtons descriptors={NAMED} size={'small'} variant={'contained'} />
      </Showcase>
      <Showcase caption={'iconOnly'}>
        <SchemaButtons descriptors={NAMED} iconOnly size={'small'} variant={'contained'} />
      </Showcase>
      <Showcase caption={'archive — the schema declares a confirmDialog'}>
        <SchemaButtons descriptors={[{name: 'archive'}]} size={'small'} variant={'contained'} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * With **no** `descriptors` the buttons are generated from the resource schema, narrowed by
 * `scope`: record actions, collection actions, or both.
 */
export const GeneratedByScope: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButtons — generated descriptors, by scope'}>
      {(['detail', 'list', 'all'] as const).map((scope) => (
        <Showcase key={scope} caption={`scope: '${scope}'`}>
          <SchemaButtons scope={scope} size={'small'} variant={'contained'} />
        </Showcase>
      ))}
    </ShowcaseStack>
  ),
};
