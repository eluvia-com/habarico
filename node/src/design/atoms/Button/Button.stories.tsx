import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../Icon';
import {Button} from './Button';

const VARIANTS = ['contained', 'outlined', 'text'] as const;
const SIZES = ['small', 'medium', 'large'] as const;

// Icon options for the Playground's `startIcon` control. Storybook `mapping` turns the selected name
// into the actual element passed to the button; `none` clears it.
const START_ICONS = ['none', 'Add', 'Edit', 'Delete', 'Tune', 'Search'] as const;
const START_ICON_MAPPING: Record<(typeof START_ICONS)[number], React.ReactNode> = {
  none: undefined,
  Add: <Icon icon={IconType.Add} />,
  Edit: <Icon icon={IconType.Edit} />,
  Delete: <Icon icon={IconType.Delete} />,
  Tune: <Icon icon={IconType.Tune} />,
  Search: <Icon icon={IconType.Search} />,
};

const meta: Meta<typeof Button> = {
  title: 'design/atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Primary action control — MUI `Button` styled through the theme, plus the orthogonal ' +
          '`iconOnly` modifier that renders any variant as a compact, square, label-less icon ' +
          'button (replacing the old `variant="icon"`). `color` maps to the semantic palette. ' +
          '`size="small"` is the in-row size: it lands on the height a control gets inside a row ' +
          "of read data, next to a `PropertyItem` line and a list's row actions, so the button " +
          'sits in the row instead of growing it. Use the Playground to explore its props.',
      },
    },
    controls: {
      include: ['variant', 'color', 'size', 'iconOnly', 'startIcon', 'disabled', 'children'],
    },
  },
  argTypes: {
    variant: {control: 'inline-radio', options: VARIANTS},
    color: {control: 'select', options: COLOR_TYPES},
    size: {control: 'inline-radio', options: SIZES},
    iconOnly: {control: 'boolean'},
    startIcon: {control: 'select', options: START_ICONS, mapping: START_ICON_MAPPING},
    disabled: {control: 'boolean'},
    children: {control: 'text'},
  },
  args: {
    variant: 'contained',
    color: 'primary',
    size: 'medium',
    startIcon: 'none',
    children: 'Button',
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Button>;

/**
 * Interactive instance — drive every prop from the Controls panel. `iconOnly` only strips the
 * button's own padding/gutters (the caller is expected to pass an icon as `children`, not a label —
 * see the `IconOnly` showcase below); the Playground's `children` control is a text string, so
 * toggling `iconOnly` on its own swaps the icon in for it here, otherwise the text would just sit
 * inside a squeezed button instead of being replaced.
 */
export const Playground: Story = {
  render: ({iconOnly, startIcon, children, ...args}) => (
    <Button
      {...args}
      iconOnly={iconOnly}
      startIcon={iconOnly ? undefined : startIcon}
      aria-label={iconOnly ? 'Action' : undefined}
    >
      {iconOnly ? (startIcon ?? <Icon icon={IconType.Edit} />) : children}
    </Button>
  ),
};

export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={VARIANTS}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => <Button variant={v}>Button</Button>}
    />
  ),
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SHOWCASE_COLORS}
      keyOf={(c) => c ?? 'default'}
      label={(c) => c ?? 'default'}
      render={(c) => (
        <Button variant={'contained'} color={c}>
          Button
        </Button>
      )}
    />
  ),
};

/**
 * `small` (28) is the in-row size — the line a read `PropertyItem` row reserves and the height MUI's
 * `small` `IconButton` renders at, so an action rendered inside such a row lines up with it (the row
 * itself is taller, it adds its own padding). `medium` (36) is the toolbar default, `large` (48) the
 * emphatic one.
 */
export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SIZES}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) => (
        <Button variant={'contained'} size={s}>
          Button
        </Button>
      )}
    />
  ),
};

/** `iconOnly` composes with every variant, producing a square, label-less control. */
export const IconOnly: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={VARIANTS}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => (
        <Button variant={v} iconOnly aria-label={'Settings'}>
          <Icon icon={IconType.Tune} size={20} />
        </Button>
      )}
    />
  ),
};
