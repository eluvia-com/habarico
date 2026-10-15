import React from 'react';
import {Box} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ObjectHero} from './ObjectHero';

// Sample avatar photo — loaded from picsum.photos (needs network access), as in the other stories.
const SAMPLE_IMAGE = 'https://picsum.photos/seed/habarico/200/200';

const FULL_ARGS = {
  image: SAMPLE_IMAGE,
  category: 'Property',
  title: 'Jihlavská 521/62, Prague – Michle',
  attributes: ['Unit 521/62', 'flat', '2+1', '50 m²', 'Petr Kašák'],
  metrics: [
    {value: 1, label: 'Management contract'},
    {value: 3, label: 'Lease agreements'},
  ],
  statuses: [
    {label: 'Active property'},
    {label: 'Profile complete', color: 'success' as const, icon: IconType.CheckCircle},
  ],
};

const meta: Meta<typeof ObjectHero> = {
  title: 'design/organisms/ObjectHero',
  component: ObjectHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A detail-page header band: a circular avatar (or fallback icon), an identity ' +
          'block (category chip, title and a middot-separated attribute subtitle), a row of KPI ' +
          'metric tiles and trailing status indicators. Purely presentational — it sits directly ' +
          'on the page background (no card) and takes all data via props; the layout wraps on ' +
          'narrow widths.',
      },
    },
    controls: {include: ['title', 'category', 'image', 'icon', 'loading']},
  },
  argTypes: {
    title: {control: 'text'},
    category: {control: 'text'},
    image: {control: 'text'},
    icon: {control: 'select', options: Object.values(IconType)},
    loading: {control: 'boolean'},
  },
  args: FULL_ARGS,
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof ObjectHero>;

/** Interactive instance — drive the identity props from the Controls panel. */
export const Playground: Story = {};

/** No image supplied — the avatar shows the fallback icon on a neutral surface. */
export const IconFallback: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {image: undefined, icon: IconType.House},
};

/**
 * `image` points at a URL that fails to load — the avatar falls back to the `icon` prop (or, when
 * `icon` is also absent, a generic broken-image icon) instead of the browser's broken-image glyph.
 */
export const BrokenImage: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {image: 'https://example.invalid/missing.png', icon: IconType.House},
};

/** Broken `image` and no `icon` fallback — the generic broken-image icon is used. */
export const BrokenImageWithNoFallback: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {image: 'https://example.invalid/missing.png', icon: undefined},
};

/** The trailing status indicators: neutral dot, tinted dots, and an icon replacing the dot. */
export const Statuses: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Neutral & completeness'} description={'As used on the property detail.'}>
        <ObjectHero
          image={SAMPLE_IMAGE}
          category={'Property'}
          title={'Jihlavská 521/62, Prague – Michle'}
          attributes={['flat', '2+1', '50 m²']}
          statuses={[
            {label: 'Active property'},
            {label: 'Profile complete', color: 'success', icon: IconType.CheckCircle},
          ]}
        />
      </Section>
      <Section title={'Semantic tints'} description={'A color tints both the indicator and text.'}>
        <ObjectHero
          title={'Object status'}
          statuses={[
            {label: 'Neutral'},
            {label: 'Info', color: 'info'},
            {label: 'Warning', color: 'warning'},
            {label: 'Error', color: 'error', icon: IconType.Cancel},
          ]}
        />
      </Section>
    </Showcase>
  ),
};

/** The KPI metric tiles — none, one, and several. */
export const Metrics: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'Single'}>
        <ObjectHero
          title={'Jihlavská 521/62'}
          metrics={[{value: 1, label: 'Management contract'}]}
        />
      </Section>
      <Section title={'Several'}>
        <ObjectHero
          title={'Jihlavská 521/62'}
          metrics={[
            {value: 1, label: 'Management contract'},
            {value: 3, label: 'Lease agreements'},
            {value: 12, label: 'Documents'},
          ]}
        />
      </Section>
    </Showcase>
  ),
};

/** Only a title — every optional section is omitted. */
export const Minimal: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {
    image: undefined,
    category: undefined,
    attributes: undefined,
    metrics: undefined,
    statuses: undefined,
    title: 'Jihlavská 521/62, Prague – Michle',
  },
};

/** Skeleton placeholders while the record loads. */
export const Loading: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  args: {loading: true},
};

/** Narrow container — the band wraps: identity block on top, metrics and statuses below. */
export const Responsive: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 480}}>
      <ObjectHero {...FULL_ARGS} />
    </Box>
  ),
};
