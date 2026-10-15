import React from 'react';
import {Icon, IconType} from '@design/atoms/Icon';
import {MenuList, Paper} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {ActionButton, ActionButtonProps} from './ActionButton';
import {withActionButtonShell} from './_storyKit';

// The confirm dialog content shown when the Playground's `confirm` switch is on, and by the
// standalone `Confirm` story below. `confirm.title` / `.content` are translation keys;
// `confirm.options` supply the interpolation variables the message references (here React Admin's
// `ra.message.delete_*`, which use `%{name}` / `%{recordRepresentation}`).
const CONFIRM: NonNullable<ActionButtonProps['confirm']> = {
  title: 'ra.message.delete_title',
  content: 'ra.message.delete_content',
  options: {name: 'article', recordRepresentation: '"Hello world"', id: 42},
};

// The Playground's own arg shape: `confirm` is a boolean switch there (on wires in `CONFIRM`
// above), not the real `{title, content, options}` object `ActionButtonProps.confirm` takes — a
// Controls widget can't usefully build that object, so the switch stands in for "is it set".
type PlaygroundArgs = Omit<ActionButtonProps, 'confirm'> & {confirm?: boolean};

const meta = {
  title: 'admin/buttons/ActionButton',
  component: ActionButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The single admin-layer action button — one surface (`button` / `menuItem`) with ' +
          'orthogonal behaviours (loading, tooltip, link) and an optional post-click `confirm`. It ' +
          'builds on the design `Button`, auto-translates a string `label`, and collapses its label ' +
          'to icon-only via `showLabel` (`false` always, a breakpoint like `"sm"` responsively).',
      },
    },
    controls: {
      include: ['label', 'variant', 'color', 'size', 'showLabel', 'loading', 'disabled', 'confirm'],
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'A plain string is auto-translated via `useTranslate`; a `ReactNode` is rendered as-is. ' +
        'Common React Admin keys: `ra.action.edit`, `ra.action.create`, `ra.action.delete`, ' +
        '`ra.action.save`, `ra.action.show`, `ra.action.export`, `ra.action.refresh`, ' +
        '`ra.action.cancel`.',
    },
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
    // destructive-action `confirm` example (the `Confirm` story below shows the same one as real
    // usage). Deliberately unnamed (no `name:` override) — see the note in node/CLAUDE.md.
    confirm: {
      control: 'boolean',
      description:
        'Gates the click behind a confirmation dialog. A boolean here for the Controls panel; the ' +
        'real prop takes a `{title, content, options}` object — see the `Confirm` story.',
    },
  },
  args: {
    label: 'ra.action.edit',
    variant: 'contained',
    color: 'primary',
    size: 'medium',
    showLabel: true,
    loading: false,
    disabled: false,
    confirm: false,
    icon: <Icon icon={IconType.Edit} />,
  },
  decorators: [withActionButtonShell],
} satisfies Meta<PlaygroundArgs>;

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/**
 * Interactive instance — drive every prop from the Controls panel. `confirm` is a boolean switch
 * here (see `argTypes.confirm`); on, it wires in the same destructive-action example the `Confirm`
 * story below hardcodes.
 */
export const Playground: Story = {
  render: ({confirm, ...args}) => (
    <ActionButton {...args} onClick={() => undefined} confirm={confirm ? CONFIRM : undefined} />
  ),
};

/** The two surfaces: a `button` and a `menuItem` (shown inside a menu list). */
export const Surface: Story = {
  // No Controls and no "Show code" — a Showcase story only demonstrates a fixed prop combination;
  // `Playground` above is the one story whose code is meant to be copy-pasted.
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  // `_args`: a zero-arity `render` makes Storybook skip `controls.include` filtering entirely
  // (falls back to the full inferred table).
  render: (_args) => (
    <>
      <ActionButton
        label={'ra.action.edit'}
        icon={<Icon icon={IconType.Edit} />}
        variant={'contained'}
        color={'primary'}
      />
      <Paper sx={{width: 220}}>
        <MenuList sx={{p: 0.5}}>
          <ActionButton
            surface={'menuItem'}
            label={'ra.action.edit'}
            icon={<Icon icon={IconType.Edit} />}
          />
          <ActionButton
            surface={'menuItem'}
            label={'ra.action.delete'}
            icon={<Icon icon={IconType.Delete} />}
            color={'error'}
          />
        </MenuList>
      </Paper>
    </>
  ),
};

/** Label visibility: always shown, icon-only (tooltip on hover), and responsive collapse below `sm`. */
export const ShowLabel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <>
      <ActionButton
        label={'ra.action.edit'}
        icon={<Icon icon={IconType.Edit} />}
        showLabel={true}
      />
      <ActionButton
        label={'ra.action.edit'}
        icon={<Icon icon={IconType.Edit} />}
        showLabel={false}
        variant={'outlined'}
      />
      <ActionButton
        label={'ra.action.edit'}
        icon={<Icon icon={IconType.Edit} />}
        showLabel={'sm'}
        variant={'outlined'}
      />
    </>
  ),
};

/** The loading state: spinner, auto-disabled, and darkened for the `contained` variant. */
export const Loading: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <>
      <ActionButton label={'ra.action.save'} variant={'contained'} color={'primary'} loading />
      <ActionButton
        label={'ra.action.save'}
        icon={<Icon icon={IconType.Edit} />}
        variant={'outlined'}
        loading
      />
    </>
  ),
};

/**
 * A destructive action gated behind a confirmation dialog (opens on click) — the same example the
 * Playground's `confirm` switch wires in, shown here as real, copy-pasteable usage. `confirm.title`
 * / `confirm.content` are translation keys; `confirm.options` supply the interpolation variables
 * the message references (here React Admin's `ra.message.delete_*`, which use `%{name}` /
 * `%{recordRepresentation}`).
 */
export const Confirm: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => (
    <ActionButton
      label={'ra.action.delete'}
      icon={<Icon icon={IconType.Delete} />}
      variant={'contained'}
      color={'error'}
      confirm={CONFIRM}
      onClick={() => undefined}
    />
  ),
};
