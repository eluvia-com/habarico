import React from 'react';
import {Box, Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {Panel} from '../../molecules/Panel';
import {PanelContent} from '../../molecules/PanelContent';
import {PanelHeader} from '../../molecules/PanelHeader';
import {Gallery, type GalleryImage} from './Gallery';

/* -- sample photos (remote — Storybook needs network to load them) -- */

const photo = (seed: string, alt: string): GalleryImage => ({
  url: `https://picsum.photos/seed/${seed}/1200/900`,
  alt,
});

const IMAGES: GalleryImage[] = [
  photo('hab-room-1', 'Living room'),
  photo('hab-room-2', 'Kitchen'),
  photo('hab-room-3', 'Bedroom'),
  photo('hab-room-4', 'Bathroom'),
  photo('hab-room-5', 'Balcony'),
];

// More slides than the dot cap, to show the proportional dots.
const MANY_IMAGES: GalleryImage[] = Array.from({length: 14}, (_, i) =>
  photo(`hab-many-${i}`, `Photo ${i + 1}`)
);

// A frame that mirrors the real placement (a gallery is ~half of the detail-view width).
const Frame = ({children}: {children: React.ReactNode}) => (
  <Box sx={{maxWidth: 640}}>{children}</Box>
);

const meta: Meta<typeof Gallery> = {
  title: 'design/organisms/Gallery',
  component: Gallery,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A presentational photo gallery — a single-image carousel with translucent prev/next ' +
          'arrows, a row of up to `maxDots` position dots and a click-to-open fullscreen lightbox ' +
          '(arrows + ←/→ keys). Purely presentational and data-source-agnostic: pass the loaded ' +
          '`images`; for backend infinite pagination also pass `total` and control `index` via ' +
          '`onIndexChange`, fetching the next page when the reported index runs past the loaded ' +
          'slides (mark that slide with `slideLoading`). Panel-agnostic — drop it inside a `Panel` ' +
          '(`PanelContent`, usually `paddingSize="small"`) or use it standalone. Note: the sample ' +
          'photos ' +
          'load from picsum.photos, so the previews need network access.',
      },
    },
    controls: {
      include: [
        'objectFit',
        'aspectRatio',
        'total',
        'maxDots',
        'loading',
        'slideLoading',
        'disableLightbox',
        'emptyMessage',
      ],
    },
  },
  argTypes: {
    objectFit: {control: 'inline-radio', options: ['cover', 'contain']},
    aspectRatio: {control: 'text'},
    total: {control: 'number'},
    maxDots: {control: 'number'},
    loading: {control: 'boolean'},
    slideLoading: {control: 'boolean'},
    disableLightbox: {control: 'boolean'},
    emptyMessage: {
      control: 'text',
      description:
        'Only rendered once `images` is empty — clearing the sample photos here doubles as the ' +
        '`Empty` state demo (type something in to see it, in place of the `Empty` story below).',
    },
  },
  args: {
    objectFit: 'cover',
    aspectRatio: '4 / 3',
    loading: false,
    slideLoading: false,
    disableLightbox: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Gallery>;

/**
 * Interactive instance — navigate with the arrows or dots, click the photo to open fullscreen.
 * `images` isn't a curatable control, so `emptyMessage` doubles as the switch for it: typing into
 * `emptyMessage` clears the sample photos to show the empty state (`emptyMessage` only ever
 * renders once `images` is empty), matching exactly what the real component does with those two
 * props.
 */
export const Playground: Story = {
  render: (args) => (
    <Box sx={{maxWidth: 640}}>
      <Gallery {...args} images={args.emptyMessage ? [] : IMAGES} />
    </Box>
  ),
};

/** A single photo — no arrows or dots, still opens fullscreen on click. */
export const Single: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Frame>
      <Gallery images={[IMAGES[0]]} />
    </Frame>
  ),
};

/** Many photos — the dots cap at `maxDots` (10) and map proportionally onto all slides. */
export const ManyImages: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Frame>
      <Gallery images={MANY_IMAGES} />
    </Frame>
  ),
};

/** Initial loading — a skeleton fills the frame until the images arrive. */
export const Loading: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Frame>
      <Gallery images={[]} loading />
    </Frame>
  ),
};

/** Empty state — a centered, muted message when there are no photos. */
export const Empty: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Frame>
      <Gallery images={[]} emptyMessage={'No photos uploaded'} />
    </Frame>
  ),
};

/**
 * Inside a `Panel` — sitting in a `PanelContent paddingSize="small"`, with a manage-photos action
 * in the header. This is how the higher (schema) layer composes it, matching the detail-view mockup.
 */
export const InPanel: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{maxWidth: 640}}>
      <Panel>
        <PanelHeader
          label={'Photos'}
          icon={IconType.Visibility}
          actions={
            <Button
              size={'small'}
              variant={'contained'}
              startIcon={<Icon icon={IconType.Edit} size={18} />}
            >
              {'Manage photos'}
            </Button>
          }
        />
        <PanelContent paddingSize={'small'}>
          <Gallery images={IMAGES} />
        </PanelContent>
      </Panel>
    </Box>
  ),
};
