import React, {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {PasswordField, PasswordFieldProps} from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  title: 'design/atoms/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A password text input built on the MUI `TextField` with a show/hide visibility toggle. ' +
          'Accepts every `TextField` prop except `type` (which it controls). Use the Playground to ' +
          'explore label, value, and state props.',
      },
    },
    controls: {include: ['label', 'value', 'placeholder', 'disabled', 'error', 'helperText']},
  },
  argTypes: {
    label: {control: 'text'},
    value: {control: 'text'},
    placeholder: {control: 'text'},
    disabled: {control: 'boolean'},
    error: {control: 'boolean'},
    helperText: {control: 'text'},
  },
  args: {label: 'Password', placeholder: 'Enter your password', value: ''},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PasswordField>;

/**
 * Interactive instance — drive every prop from the Controls panel.
 *
 * Kept in local state, seeded from the `value` arg, rather than handed the arg directly. MUI decides
 * once — on an input's first render, into a ref — whether that input is controlled, so a field that
 * starts with no `value` and is handed one later by the Controls panel is never registered as
 * filled: the text shows up, but the label never shrinks off it and sits across the value instead.
 * Seeding `value` to `''` in the args keeps the field controlled from the first render, and the
 * state is what still lets it be typed into.
 */
const PasswordPlayground = ({value, ...rest}: PasswordFieldProps) => {
  const [current, setCurrent] = useState(typeof value === 'string' ? value : '');
  return (
    <PasswordField {...rest} value={current} onChange={(event) => setCurrent(event.target.value)} />
  );
};

// `render` returns the local `PasswordPlayground` wrapper (it owns the controlled-value
// workaround above), so "Show code" would otherwise print that wrapper's tag. This rebuilds the
// real, controlled usage from the story's current args instead — reactive, unlike a static override.
const buildPlaygroundSource = (args: PasswordFieldProps) => {
  const props = ['value={value}', 'onChange={(event) => setValue(event.target.value)}'];
  if (args.label) props.push(`label=${JSON.stringify(args.label)}`);
  if (args.placeholder) props.push(`placeholder=${JSON.stringify(args.placeholder)}`);
  if (args.disabled) props.push('disabled');
  if (args.error) props.push('error');
  if (args.helperText) props.push(`helperText=${JSON.stringify(args.helperText)}`);
  return `const [value, setValue] = useState(${JSON.stringify(typeof args.value === 'string' ? args.value : '')});

<PasswordField
  ${props.join('\n  ')}
/>`;
};

export const Playground: Story = {
  // Keyed on the arg so editing `value` in the Controls panel remounts the demo and re-seeds its
  // state — the React way to reset state from a prop, and it re-latches MUI's controlled/
  // uncontrolled decision along with it. Typing in the field changes no key, so it never remounts.
  render: (args) => <PasswordPlayground key={String(args.value)} {...args} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: PasswordFieldProps}) =>
          buildPlaygroundSource(args),
      },
    },
  },
};

/**
 * Controlled demo — keeps its own value so typing and the visibility toggle both work.
 * Hooks must live in a top-level component, never inside a story `render` arrow.
 */
const ControlledPassword = () => {
  const [value, setValue] = useState('super-secret');
  return (
    <PasswordField label={'Password'} value={value} onChange={(e) => setValue(e.target.value)} />
  );
};

export const Controlled: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <ControlledPassword />,
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Empty'}>
        <PasswordField label={'Password'} placeholder={'Enter your password'} />
      </Section>
      <Section title={'Filled'}>
        <PasswordField label={'Password'} defaultValue={'super-secret'} />
      </Section>
      <Section title={'Error'} description={'Paired with helper text.'}>
        <PasswordField
          label={'Password'}
          defaultValue={'123'}
          error
          helperText={'Password is too short'}
        />
      </Section>
      <Section title={'Disabled'}>
        <PasswordField label={'Password'} defaultValue={'super-secret'} disabled />
      </Section>
    </Showcase>
  ),
};
