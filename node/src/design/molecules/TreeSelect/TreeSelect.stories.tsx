import React, {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {TreeSelect} from './TreeSelect';
import {TreeChoice, TreeItemId} from './types';

// A small category hierarchy — roots omit `parentId`, children point at their parent.
const CHOICES: TreeChoice[] = [
  {id: 'electronics', name: 'Electronics'},
  {id: 'computers', name: 'Computers', parentId: 'electronics'},
  {id: 'laptops', name: 'Laptops', parentId: 'computers'},
  {id: 'desktops', name: 'Desktops', parentId: 'computers'},
  {id: 'phones', name: 'Phones', parentId: 'electronics'},
  {id: 'home', name: 'Home & Garden'},
  {id: 'furniture', name: 'Furniture', parentId: 'home'},
  {id: 'lighting', name: 'Lighting', parentId: 'home'},
];

// Hook lives in a top-level component (never an inline `render` arrow) so Storybook's "Show code"
// serializer — which re-invokes render outside the providers — never trips over it.
const InteractiveTreeSelect = ({
  selectedIds: initial = [],
  ...props
}: React.ComponentProps<typeof TreeSelect>) => {
  const [selectedIds, setSelectedIds] = useState<TreeItemId[]>(initial);
  return <TreeSelect {...props} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
};

/**
 * Presentational hierarchical multi-select. It rebuilds a tree from a flat `choices` list (via each
 * choice's `parentId`) and binds the checked ids through `selectedIds` / `onSelectionChange`. Omitting
 * `onSelectionChange` renders it read-only. It is React-Admin- and schema-free: these stories drive it
 * with a static in-memory dataset. The admin `TreeArrayInput` / `TreeArrayField` are thin bindings over it.
 */
const meta = {
  title: 'design/molecules/TreeSelect',
  component: TreeSelect,
  tags: ['autodocs'],
  parameters: {
    controls: {include: ['expand', 'disabled']},
  },
  argTypes: {
    expand: {
      control: 'inline-radio',
      options: ['all', 'selected'],
      description: 'Which nodes start expanded.',
    },
    disabled: {control: 'boolean'},
  },
  args: {
    choices: CHOICES,
    selectedIds: ['laptops'],
    expand: 'all',
    disabled: false,
  },
  decorators: [padDecorator],
} satisfies Meta<typeof TreeSelect>;

export default meta;
type Story = StoryObj<typeof TreeSelect>;

// `render` returns the local `InteractiveTreeSelect` helper (it owns the `selectedIds` state — see
// the "Hooks live in a top-level demo component" rule), so "Show code" would otherwise show that
// helper's tag instead of the real controlled usage. `docs.source.transform` rebuilds that real
// usage from the story's current args instead — reactive, unlike a static override.
const buildPlaygroundSource = ({
  expand,
  disabled,
}: {
  expand?: 'all' | 'selected';
  disabled?: boolean;
}) =>
  `<TreeSelect
  choices={choices}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}${expand ? `\n  expand=${JSON.stringify(expand)}` : ''}${
    disabled ? '\n  disabled' : ''
  }
/>`;

/** Interactive — hold <kbd>ctrl</kbd> to select multiple nodes. */
export const Playground: Story = {
  render: (args) => <InteractiveTreeSelect {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (
          _code: string,
          {args}: {args: {expand?: 'all' | 'selected'; disabled?: boolean}}
        ) => buildPlaygroundSource(args),
      },
    },
  },
};

/** No `onSelectionChange` ⇒ read-only value display; `expand="selected"` opens just the ancestors. */
export const ReadOnly: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <TreeSelect choices={CHOICES} selectedIds={['laptops', 'phones']} expand="selected" />
  ),
};

/** Greyed out and non-interactive. */
export const Disabled: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <TreeSelect
      choices={CHOICES}
      selectedIds={['laptops']}
      onSelectionChange={() => undefined}
      disabled
    />
  ),
};

/** The two expansion modes side by side. */
export const Expansion: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section
        title="expand = all"
        description="Every node open — the whole hierarchy while picking."
      >
        <TreeSelect choices={CHOICES} selectedIds={['laptops']} expand="all" />
      </Section>
      <Section
        title="expand = selected"
        description="Only ancestors of the selected nodes — reveals the current value."
      >
        <TreeSelect choices={CHOICES} selectedIds={['laptops']} expand="selected" />
      </Section>
    </Showcase>
  ),
};
