import React from 'react';
import {Stack} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, Section, padDecorator} from '../../_storyKit';
import {ValueLocationContextProvider} from '../../contexts/ValueLocationContext';
import {EnumChip} from './EnumChip';
import {resolveEnumIcon} from './utils';

const COLORS = ['default', 'primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

// The Playground drives the icon through a name control for convenience; the component itself takes a
// pre-resolved `icon` element (resolution is the caller's job), so the story resolves it in `render`.
type PlaygroundArgs = React.ComponentProps<typeof EnumChip> & {iconName: string};

// Names the stories below render, all present in `@mui/icons-material` — the options of the
// Playground's icon control.
const ICON_NAMES = ['CheckCircle', 'Warning', 'Cancel', 'Circle', 'Schedule', 'Flag'] as const;

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/EnumChip',
  component: EnumChip,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A soft-variant `Chip` for an enum value — a pre-resolved MUI icon element (via ' +
          '`resolveEnumIcon`) plus a label, tinted by `color`. It reads `ValueLocationContext`: when the ' +
          'value is rendered inside a collection (datagrid/gallery) the chip collapses to an icon-only, ' +
          'tooltipped glyph and constrains its width to the column; otherwise it shows the full label ' +
          'with ellipsis.',
      },
    },
    controls: {include: ['iconName', 'label', 'color']},
  },
  argTypes: {
    // A select, not free text: `resolveEnumIcon` warns and returns `null` for a name that is not in
    // `@mui/icons-material`, so every keystroke of a half-typed name silently renders a chip with no
    // icon. These six all resolve.
    iconName: {
      control: 'select',
      options: ICON_NAMES,
      description: 'MUI icon name (from `@mui/icons-material`).',
    },
    label: {control: 'text'},
    color: {control: 'select', options: COLORS},
  },
  args: {iconName: 'CheckCircle', label: 'Active', color: 'success', source: 'status'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Interactive — tweak the icon, label and color in Controls. */
export const Playground: Story = {
  render: ({iconName, ...args}) => (
    <EnumChip {...args} icon={resolveEnumIcon(iconName) ?? undefined} />
  ),
};

/** Every palette color (plus the neutral `default`). */
export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row>
      {COLORS.map((color) => (
        <EnumChip
          key={color}
          icon={resolveEnumIcon('Circle') ?? undefined}
          label={color}
          color={color}
          source={'status'}
        />
      ))}
    </Row>
  ),
};

/**
 * Standalone (detail view) vs inside a collection: the same chips collapse to
 * icon-only, tooltipped glyphs when `ValueLocationContext` reports a collection.
 */
export const Placement: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Stack spacing={4}>
      <Section title={'Standalone — full label + ellipsis'}>
        <Row>
          <EnumChip
            icon={resolveEnumIcon('CheckCircle') ?? undefined}
            label={'Active'}
            color={'success'}
            source={'status'}
          />
          <EnumChip
            icon={resolveEnumIcon('Warning') ?? undefined}
            label={'Pending'}
            color={'warning'}
            source={'status'}
          />
          <EnumChip
            icon={resolveEnumIcon('Cancel') ?? undefined}
            label={'Blocked'}
            color={'error'}
            source={'status'}
          />
        </Row>
      </Section>
      <Section title={'In a collection — icon-only with tooltip'}>
        <ValueLocationContextProvider value={{isInCollection: true}}>
          <Row>
            <EnumChip
              icon={resolveEnumIcon('CheckCircle') ?? undefined}
              label={'Active'}
              color={'success'}
              source={'status'}
            />
            <EnumChip
              icon={resolveEnumIcon('Warning') ?? undefined}
              label={'Pending'}
              color={'warning'}
              source={'status'}
            />
            <EnumChip
              icon={resolveEnumIcon('Cancel') ?? undefined}
              label={'Blocked'}
              color={'error'}
              source={'status'}
            />
          </Row>
        </ValueLocationContextProvider>
      </Section>
    </Stack>
  ),
};
