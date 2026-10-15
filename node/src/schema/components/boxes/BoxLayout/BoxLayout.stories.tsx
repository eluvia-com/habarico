import React from 'react';
import {Button} from '@design/atoms/Button';
import {Typography} from '@mui/material';
import {box} from '@schema/components/_data';
import {ShowcaseStack, withSchemaBoxShell} from '@schema/components/_storyKit';
import type {BoxSchema, BoxType} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {BoxLayout} from './BoxLayout';

const Body = ({children = 'Box body'}: {children?: React.ReactNode}) => (
  <Typography variant={'body2'} color={'text.secondary'}>
    {children}
  </Typography>
);

const schemaOf = (type: BoxType, overrides: Partial<BoxSchema> = {}): BoxSchema =>
  box({name: `layout_${type}`, type, ...overrides});

/**
 * The **surface primitive every box renders through** — not a box type of its own. It maps a box
 * schema onto the design layer's containers, and it is the reason all the boxes look like one
 * system despite each deciding its own chrome.
 *
 * The single decision it takes from its caller is `card`:
 *
 * - **`card: true`** → `Panel` + `PanelHeader` / `PanelContent` / `PanelFooter` — a real surface
 *   with a shadow. The `Panel` picks its root-vs-nested variant from `InsidePanelContext` on its
 *   own, so `BoxLayout` never sets a variant.
 * - **`card: false`** → `Section` + its header / content / footer counterparts — transparent, for a
 *   box that only groups.
 *
 * Everything else it derives from the schema (`useBoxLayout`): the content **padding**, the
 * full-bleed **flush** flag and the **collapsible** behaviour all follow from `type`, which is why
 * a read-only inline `array` is edge to edge while a `simple` box has a gutter. `paddingSize` and
 * `flush` are escape hatches for a box that needs to override its type's default.
 *
 * The header row is omitted entirely when there is no `label` and no `action` — except on a
 * collapsible card box, which keeps it for the toggle.
 */
const meta = {
  title: 'schema/boxes/BoxLayout',
  component: BoxLayout,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaBoxShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The two surfaces side by side — the whole of what `card` decides. */
export const CardVsSection: Story = {
  render: () => (
    <ShowcaseStack title={'BoxLayout — card chrome'}>
      <BoxLayout schema={schemaOf('simple')} card label={'card: true → Panel'}>
        <Body />
      </BoxLayout>
      <BoxLayout schema={schemaOf('simple')} card={false} label={'card: false → Section'}>
        <Body />
      </BoxLayout>
    </ShowcaseStack>
  ),
};

/** Header and footer slots. The footer row appears only once a slot is filled. */
export const Slots: Story = {
  render: () => (
    <ShowcaseStack title={'BoxLayout — header & footer slots'}>
      <BoxLayout schema={schemaOf('simple')} card label={'Label only'}>
        <Body />
      </BoxLayout>
      <BoxLayout
        schema={schemaOf('simple')}
        card
        label={'Label + header action'}
        action={<Button size={'small'}>Action</Button>}
      >
        <Body />
      </BoxLayout>
      <BoxLayout
        schema={schemaOf('simple')}
        card
        label={'Label + footer'}
        footerLeft={<Button size={'small'}>Back</Button>}
        footerRight={<Button size={'small'}>Save</Button>}
      >
        <Body />
      </BoxLayout>
      <BoxLayout schema={schemaOf('simple')} card>
        <Body>No label, no action → no header row at all</Body>
      </BoxLayout>
    </ShowcaseStack>
  ),
};

/**
 * Padding comes from the box **type**, not from a prop: a `list` box is full-bleed so its datagrid
 * can reach the edges, while a `simple` box keeps a gutter. This is why boxes of different types
 * sit differently on the same surface.
 */
export const PaddingByType: Story = {
  render: () => (
    <ShowcaseStack title={'BoxLayout — padding derived from the box type'}>
      {(['simple', 'list'] as BoxType[]).map((type) => (
        <BoxLayout key={type} schema={schemaOf(type)} card label={`type: ${type}`}>
          <Body>{`Content of a ${type} box`}</Body>
        </BoxLayout>
      ))}
    </ShowcaseStack>
  ),
};

/** A collapsible card keeps its header row for the toggle even with no label and no action. */
export const Collapsible: Story = {
  render: () => (
    <ShowcaseStack title={'BoxLayout — collapsible'}>
      <BoxLayout schema={schemaOf('simple', {collapsible: 'open'})} card label={'open'}>
        <Body />
      </BoxLayout>
      <BoxLayout schema={schemaOf('simple', {collapsible: 'closed'})} card label={'closed'}>
        <Body />
      </BoxLayout>
    </ShowcaseStack>
  ),
};
