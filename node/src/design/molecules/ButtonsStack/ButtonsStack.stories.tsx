import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, VariantGrid, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {
  ButtonDefinition,
  ButtonsStack,
  ButtonsStackSurface,
  ButtonsStackVariant,
} from './ButtonsStack';

const noop = () => {};

/** A representative set of buttons: two plain, an error-tinted destructive one, plus more for overflow. */
const DEMO_BUTTONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Duplicate', icon: IconType.Add, onClick: noop},
  {label: 'Share', icon: IconType.Handshake, onClick: noop},
  {label: 'Archive', icon: IconType.Delete, color: 'error', onClick: noop},
];

const SURFACES: ButtonsStackSurface[] = ['button', 'iconButton'];
const VARIANTS: ButtonsStackVariant[] = ['contained', 'outlined', 'text'];
const SIZES = ['small', 'medium', 'large'] as const;

const meta: Meta<typeof ButtonsStack> = {
  title: 'design/molecules/ButtonsStack',
  component: ButtonsStack,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A horizontal row of buttons that collapses the surplus into a `⋮` overflow menu. ' +
          'Driven by an array of `ButtonDefinition`s (label, icon, onClick, color, disabled) rather ' +
          'than hand-composed buttons. Expanded buttons render as a design `Button` (styled by ' +
          '`variant` + the orthogonal `iconOnly`) or a raw `IconButton`, chosen by the `surface` prop; ' +
          'buttons beyond `maxVisible` become tinted menu items (the `⋮` trigger is extra).',
      },
    },
    controls: {
      include: ['surface', 'variant', 'iconOnly', 'size', 'maxVisible', 'moreLabel'],
    },
  },
  argTypes: {
    surface: {control: 'inline-radio', options: SURFACES},
    variant: {control: 'inline-radio', options: VARIANTS},
    iconOnly: {control: 'boolean'},
    size: {control: 'inline-radio', options: SIZES},
    maxVisible: {control: {type: 'number', min: 0}},
    moreLabel: {control: 'text'},
  },
  args: {
    surface: 'button',
    variant: 'contained',
    iconOnly: true,
    size: 'small',
    maxVisible: 3,
    buttons: DEMO_BUTTONS,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof ButtonsStack>;

/** Interactive instance — drive the stack props from the Controls panel. */
export const Playground: Story = {};

/** The two backing surfaces (shown icon-only): a `button` stack vs. raw `iconButton`s. */
export const Surfaces: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SURFACES}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) => <ButtonsStack surface={s} iconOnly buttons={DEMO_BUTTONS} />}
    />
  ),
};

/** The `button` variants (labeled), plus the orthogonal `iconOnly` modifier. */
export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {VARIANTS.map((v) => (
        <Section key={v} title={v}>
          <ButtonsStack surface={'button'} variant={v} buttons={DEMO_BUTTONS.slice(0, 2)} />
        </Section>
      ))}
      <Section title={'iconOnly'}>
        <ButtonsStack surface={'button'} variant={'text'} iconOnly buttons={DEMO_BUTTONS} />
      </Section>
    </Showcase>
  ),
};

/** Sizes applied to the whole stack. */
export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SIZES}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) => <ButtonsStack surface={'iconButton'} size={s} buttons={DEMO_BUTTONS} />}
    />
  ),
};

/** `maxVisible` collapses the surplus into the `⋮` overflow menu — the trigger is always extra. */
export const Overflow: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {[undefined, 1, 2, 3].map((max) => (
        <Section
          key={String(max)}
          title={max == null ? 'maxVisible: none (all expanded)' : `maxVisible: ${max}`}
        >
          <ButtonsStack surface={'iconButton'} maxVisible={max} buttons={DEMO_BUTTONS} />
        </Section>
      ))}
    </Showcase>
  ),
};

/** Per-button semantic color tints both the expanded button and its overflow menu item. */
export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Expanded (icon buttons)'}>
        <ButtonsStack
          surface={'iconButton'}
          buttons={[
            {label: 'Edit', icon: IconType.Edit, color: 'primary', onClick: noop},
            {label: 'Approve', icon: IconType.Add, color: 'success', onClick: noop},
            {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
          ]}
        />
      </Section>
      <Section title={'Overflow (menu items keep their tint)'}>
        <ButtonsStack
          surface={'iconButton'}
          maxVisible={1}
          buttons={[
            {label: 'Edit', icon: IconType.Edit, onClick: noop},
            {label: 'Approve', icon: IconType.Add, color: 'success', onClick: noop},
            {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
          ]}
        />
      </Section>
    </Showcase>
  ),
};
