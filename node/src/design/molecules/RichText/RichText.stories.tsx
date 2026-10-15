import React from 'react';
import {Box, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, VariantGrid, padDecorator} from '../../_storyKit';
import {RichText} from './RichText';

const meta: Meta<typeof RichText> = {
  title: 'design/molecules/RichText',
  component: RichText,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders a lightweight **rich-text string** into inline nodes: `[icon:Name(:color)]` ' +
          'glyphs (via the `Icon` atom), `[highlight]…[/highlight]` spans, `[bold]…[/bold]` and ' +
          'plain text. Purely presentational — pass the raw markup as `text`; unknown or unclosed ' +
          'tags fall back to plain text. See `./utils` for the token grammar. It is the ' +
          'render half of the schema-driven `DynamicText`, which resolves templates and delegates ' +
          'here.',
      },
    },
    controls: {include: ['text']},
  },
  argTypes: {
    text: {control: 'text'},
  },
  args: {
    text: '[icon:CheckCircle:#2e7d32] [highlight]All good[/highlight] — [bold]ready[/bold]',
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof RichText>;

/** Interactive instance — type markup into the `text` control. */
export const Playground: Story = {
  render: (args) => (
    <Typography variant={'body1'}>
      <RichText {...args} />
    </Typography>
  ),
};

/** A cell for a labeled markup sample. */
const TokenCell = ({text}: {text: string}) => (
  <Box sx={{border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 1, minWidth: 220}}>
    <Typography variant={'body2'}>
      <RichText text={text} />
    </Typography>
  </Box>
);

/** Every supported token type. */
export const Tokens: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      align={'flex-start'}
      items={
        [
          {key: 'plain', label: 'Plain text', text: 'Hello, plain world'},
          {key: 'icon', label: 'Icon', text: '[icon:Home] Home'},
          {key: 'iconColor', label: 'Icon with color', text: '[icon:CheckCircle:#2e7d32] Active'},
          {key: 'highlight', label: 'Highlight', text: '[highlight]Highlighted text[/highlight]'},
          {key: 'bold', label: 'Bold', text: '[bold]Bold text[/bold]'},
          {
            key: 'combined',
            label: 'Combined',
            text: '[icon:Warning:#f57c00] [highlight]Check[/highlight] — [bold]required[/bold]',
          },
        ] as const
      }
      keyOf={(i) => i.key}
      label={(i) => i.label}
      render={(i) => <TokenCell text={i.text} />}
    />
  ),
};

/** Unknown or unclosed tags degrade gracefully to plain text. */
export const Fallbacks: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Graceful fallbacks'} description={'Malformed markup renders as plain text.'}>
        <VariantGrid
          align={'flex-start'}
          items={
            [
              {key: 'unknown', label: 'Unknown tag', text: '[unknown]tag[/unknown]'},
              {key: 'unclosed', label: 'Unclosed tag', text: '[highlight]missing closing tag'},
            ] as const
          }
          keyOf={(i) => i.key}
          label={(i) => i.label}
          render={(i) => <TokenCell text={i.text} />}
        />
      </Section>
    </Showcase>
  ),
};
