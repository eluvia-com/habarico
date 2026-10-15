import React from 'react';
import {Icon, IconType} from '@design/atoms/Icon';
import {Meta, StoryObj} from '@storybook/react-vite';
import {ActionButtonWithChoices, ActionButtonWithChoicesProps} from './ActionButtonWithChoices';
import {withActionButtonShell} from './_storyKit';

const CHOICES = [
  {label: 'Open in dialog', value: 'dialog'},
  {label: 'Open in side panel', value: 'panel'},
  {label: 'Open full page', value: 'page'},
];

// The confirm dialog content shown when the Playground's `confirm` switch is on, and by the
// standalone `WithConfirm` story below. `confirm.title` / `.content` are translation keys;
// `confirm.options` supply the interpolation variables the message references (here React Admin's
// `ra.message.delete_*`, which use `%{name}` / `%{recordRepresentation}`).
const CONFIRM: NonNullable<ActionButtonWithChoicesProps['confirm']> = {
  title: 'ra.message.delete_title',
  content: 'ra.message.delete_content',
  options: {name: 'article', recordRepresentation: '"Hello world"', id: 42},
};

// The Playground's own arg shape: `confirm` is a boolean switch there (on wires in `CONFIRM`
// above), not the real `{title, content, options}` object `ActionButtonWithChoicesProps.confirm`
// takes — a Controls widget can't usefully build that object, so the switch stands in for "is it set".
type PlaygroundArgs = Omit<ActionButtonWithChoicesProps, 'confirm'> & {confirm?: boolean};

const meta = {
  title: 'admin/buttons/ActionButtonWithChoices',
  component: ActionButtonWithChoices,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A trigger button that opens a menu of schema-free `ActionChoice`s. Shares the ' +
          '`ActionButton` surface/behaviours (minus `onClick`/`to`) and supports an optional ' +
          'per-choice `confirm` dialog before `onSelect` fires.',
      },
    },
    controls: {
      include: ['label', 'variant', 'color', 'size', 'showLabel', 'loading', 'disabled', 'confirm'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    variant: {control: 'inline-radio', options: ['text', 'outlined', 'contained']},
    color: {
      control: 'select',
      options: ['inherit', 'primary', 'secondary', 'info', 'success', 'warning', 'error'],
    },
    size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
    showLabel: {control: 'inline-radio', options: [true, false, 'sm']},
    loading: {control: 'boolean'},
    disabled: {control: 'boolean'},
    // The real prop is a `{title, content, options}` object, not something a Controls widget can
    // usefully build — here it's a boolean switch; on, the Playground wires in a fixed
    // destructive-action `confirm` example (the `WithConfirm` story below shows the same one as
    // real usage). Deliberately unnamed (no `name:` override) — see the note in node/CLAUDE.md.
    confirm: {
      control: 'boolean',
      description:
        'Gates each choice behind a confirmation dialog. A boolean here for the Controls panel; ' +
        'the real prop takes a `{title, content, options}` object — see the `WithConfirm` story.',
    },
  },
  args: {
    label: 'ra.action.show',
    variant: 'contained',
    color: 'primary',
    size: 'medium',
    showLabel: true,
    loading: false,
    disabled: false,
    confirm: false,
    icon: <Icon icon={IconType.Visibility} />,
  },
  decorators: [withActionButtonShell],
} satisfies Meta<PlaygroundArgs>;

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/**
 * Interactive instance — drive every prop from the Controls panel; picking a choice invokes
 * `onSelect`. `confirm` is a boolean switch here (see `argTypes.confirm`); on, it wires in the same
 * destructive-action example the `WithConfirm` story below hardcodes.
 */
export const Playground: Story = {
  render: ({confirm, ...args}) => (
    <ActionButtonWithChoices
      {...args}
      choices={CHOICES}
      onSelect={() => undefined}
      confirm={confirm ? CONFIRM : undefined}
    />
  ),
};

/** Click to open the choices menu; picking a choice invokes `onSelect`. */
export const Default: Story = {
  // No Controls and no "Show code" — a Showcase story only demonstrates a fixed prop combination;
  // `Playground` above is the one story whose code is meant to be copy-pasted.
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  // `_args`: a zero-arity `render` makes Storybook skip `controls.include` filtering entirely
  // (falls back to the full inferred table).
  render: (_args) => (
    <ActionButtonWithChoices
      label={'ra.action.show'}
      icon={<Icon icon={IconType.Visibility} />}
      variant={'contained'}
      color={'primary'}
      choices={CHOICES}
      onSelect={() => undefined}
    />
  ),
};

/**
 * Each choice is confirmed before it fires — the same example the Playground's `confirm` switch
 * wires in, shown here as real, copy-pasteable usage.
 */
export const WithConfirm: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <ActionButtonWithChoices
      label={'ra.action.delete'}
      icon={<Icon icon={IconType.Delete} />}
      variant={'contained'}
      color={'error'}
      choices={CHOICES}
      onSelect={() => undefined}
      confirm={CONFIRM}
    />
  ),
};
