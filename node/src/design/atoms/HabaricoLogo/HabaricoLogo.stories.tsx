import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {Box} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Row, Section, Showcase, padDecorator} from '../../_storyKit';
import {HabaricoLogo} from './HabaricoLogo';

// [height, width] — logos are sized by their container, so every showcase renders
// them at a few box sizes with a dashed border to reveal the space they occupy.
const SIZES: Array<[number, number]> = [
  [50, 150],
  [150, 150],
  [200, 350],
];

const meta: Meta<typeof HabaricoLogo> = {
  title: 'design/atoms/HabaricoLogo',
  component: HabaricoLogo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Habarico brand logo, rendered as inline SVG and linked via `RouterLink`. It is ' +
          'sized by its container (`height` / `width`); toggle `inverted` for dark surfaces, ' +
          '`monochromatic` / `color` to tint it, and `icon` for the compact mark. Use the ' +
          'Playground to explore its props.',
      },
    },
    controls: {
      include: ['inverted', 'monochromatic', 'icon', 'color', 'disableLink', 'href'],
    },
  },
  argTypes: {
    inverted: {control: 'boolean'},
    monochromatic: {control: 'boolean'},
    icon: {control: 'boolean'},
    color: {control: 'color'},
    disableLink: {control: 'boolean'},
    href: {control: 'text'},
  },
  args: {height: 60, width: 200, href: '/'},
  decorators: [
    padDecorator,
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HabaricoLogo>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

/**
 * The logo in the context of the container it sits in: a few box sizes with a dashed
 * border, on the surfaces it is used on — a light page, a dark surface (`inverted`) and
 * tinted monochromatic.
 */
export const Surfaces: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Light surface'}>
        <Row spacing={3}>
          {SIZES.map(([height, width], i) => (
            <HabaricoLogo key={i} height={height} width={width} border={'1px dashed silver'} />
          ))}
        </Row>
      </Section>

      <Section title={'Dark surface (inverted)'}>
        <Box sx={{p: 2, borderRadius: 1, bgcolor: 'grey.800'}}>
          <Row spacing={3}>
            {SIZES.map(([height, width], i) => (
              <HabaricoLogo
                key={i}
                height={height}
                width={width}
                inverted
                border={'1px dashed silver'}
              />
            ))}
          </Row>
        </Box>
      </Section>

      <Section title={'Monochromatic'}>
        <Row spacing={3}>
          {SIZES.map(([height, width], i) => (
            <HabaricoLogo
              key={i}
              height={height}
              width={width}
              monochromatic
              color={'black'}
              border={'1px dashed silver'}
            />
          ))}
        </Row>
      </Section>
    </Showcase>
  ),
};

/** The compact icon-only mark, again shown in its container box. */
export const Icon: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Row spacing={3}>
      <HabaricoLogo height={60} width={60} icon border={'1px dashed silver'} />
      <Box sx={{p: 2, borderRadius: 1, bgcolor: 'grey.800'}}>
        <HabaricoLogo height={60} width={60} icon inverted border={'1px dashed silver'} />
      </Box>
    </Row>
  ),
};
