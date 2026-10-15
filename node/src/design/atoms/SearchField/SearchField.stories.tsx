import React, {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {SearchField} from './SearchField';

const meta: Meta<typeof SearchField> = {
  title: 'design/atoms/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A search text input built on the MUI `TextField` with a leading search icon. It is a ' +
          'purely visual specialization of `TextField` for the search input inside list filters — ' +
          'functionally it is a standard text field. Accepts every `TextField` prop except `type` ' +
          '(which it controls). Use the Playground to explore label, value, and state props.',
      },
    },
    controls: {
      include: ['label', 'value', 'placeholder', 'size', 'disabled', 'error', 'helperText'],
    },
  },
  argTypes: {
    label: {control: 'text'},
    value: {control: 'text'},
    placeholder: {control: 'text'},
    size: {control: 'inline-radio', options: ['small', 'medium']},
    disabled: {control: 'boolean'},
    error: {control: 'boolean'},
    helperText: {control: 'text'},
  },
  args: {placeholder: 'Search', size: 'medium'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SearchField>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

/**
 * Controlled demo — keeps its own value so typing works.
 * Hooks must live in a top-level component, never inside a story `render` arrow.
 */
const ControlledSearch = () => {
  const [value, setValue] = useState('');
  return (
    <SearchField placeholder={'Search'} value={value} onChange={(e) => setValue(e.target.value)} />
  );
};

export const Controlled: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <ControlledSearch />,
};

export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Empty'}>
        <SearchField placeholder={'Search'} />
      </Section>
      <Section title={'Filled'}>
        <SearchField placeholder={'Search'} defaultValue={'Beethoven'} />
      </Section>
      <Section title={'Small'} description={'Compact size used in filters.'}>
        <SearchField placeholder={'Search'} size={'small'} />
      </Section>
      <Section title={'Disabled'}>
        <SearchField placeholder={'Search'} defaultValue={'Beethoven'} disabled />
      </Section>
    </Showcase>
  ),
};
