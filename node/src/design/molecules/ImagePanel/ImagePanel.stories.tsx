import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Box, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {SHOWCASE_COLORS, Showcase, VariantGrid, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {ImagePanel} from './ImagePanel';

/** Stable placeholder image used across the showcases. */
const SAMPLE_SRC = 'https://picsum.photos/seed/habarico/400/400';

/** Generated once at module load so the tiles render identically on every render. */
const SAMPLE_CAPTION = new LoremIpsum().generateSentences(2);

const noop = () => {};

const SAMPLE_ACTION_DEFS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Add', icon: IconType.Add, onClick: noop},
];

/** The canonical actions slot — icon buttons via `ButtonsStack`. */
const SampleActions = () => <ButtonsStack surface={'iconButton'} buttons={SAMPLE_ACTION_DEFS} />;

/** A short caption body used across the showcases. */
const SampleCaption = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    {SAMPLE_CAPTION}
  </Typography>
);

type PlaygroundArgs = {
  src: string;
  info?: string;
  infoColor: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  hoverable: boolean;
  /** Story-only: `children` is a free-form slot (the real prop takes any `ReactNode`, e.g. the
   * caption below), so this toggles the sample caption on/off for the Controls panel. */
  showCaption: boolean;
  /** Story-only: `actions` takes an element (a `ButtonsStack`, typically), so this toggles the
   * sample actions row on/off for the Controls panel. */
  showActions: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/ImagePanel',
  component: ImagePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A square **image tile** on a `Card` surface: a cover image with an optional corner ' +
          'chip and a hover overlay, plus a content area below for a caption and an actions slot. ' +
          'Purely presentational — pass the image URL, labels and callbacks as props. Used to ' +
          'build image galleries (see the schema-driven `SchemaImages` collection, which wraps it ' +
          'with drag-and-drop). It extends MUI `Card`, so `variant`, `sx` and the other card props ' +
          'pass straight through.',
      },
    },
    controls: {include: ['info', 'infoColor', 'hoverable', 'showCaption', 'showActions']},
  },
  argTypes: {
    info: {control: 'text'},
    infoColor: {
      control: 'select',
      options: ['primary', 'secondary', 'info', 'success', 'warning', 'error'],
    },
    hoverable: {control: 'boolean'},
    showCaption: {control: 'boolean'},
    showActions: {control: 'boolean'},
  },
  args: {
    src: SAMPLE_SRC,
    info: 'new',
    infoColor: 'info',
    hoverable: true,
    showCaption: true,
    showActions: true,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof ImagePanel>;

/**
 * Interactive instance — drive the tile's props from the Controls panel. `showCaption` and
 * `showActions` are story-only: they toggle the real `children`/`actions` slots, which take a
 * node rather than a primitive Controls can drive directly.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({src, info, infoColor, hoverable, showCaption, showActions}) => (
    <Box sx={{width: 260}}>
      <ImagePanel
        src={src}
        info={info}
        infoColor={infoColor}
        hoverable={hoverable}
        actions={
          showActions ? (
            <ButtonsStack surface={'iconButton'} buttons={SAMPLE_ACTION_DEFS} />
          ) : undefined
        }
      >
        {showCaption && (
          <Typography variant={'body2'} color={'text.secondary'}>
            {SAMPLE_CAPTION}
          </Typography>
        )}
      </ImagePanel>
    </Box>
  ),
};

/** The building blocks toggled on and off: chip, hover overlay and actions slot. */
export const States: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      align={'flex-start'}
      items={
        [
          {key: 'plain', label: 'Plain', props: {hoverable: false}},
          {key: 'hover', label: 'Hoverable', props: {hoverable: true}},
          {key: 'info', label: 'With chip', props: {info: 'new', hoverable: false}},
          {
            key: 'actions',
            label: 'With actions',
            props: {actions: <SampleActions />, hoverable: false},
          },
        ] as const
      }
      keyOf={(i) => i.key}
      label={(i) => i.label}
      render={(i) => (
        <Box sx={{width: 240}}>
          <ImagePanel src={SAMPLE_SRC} {...i.props}>
            <SampleCaption />
          </ImagePanel>
        </Box>
      )}
    />
  ),
};

/** Actions for the narrow-tile demo below — one more than comfortably fits at that width. */
const NARROW_ACTION_DEFS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Add', icon: IconType.Add, onClick: noop},
  {label: 'Delete', icon: IconType.Delete, onClick: noop},
];

/**
 * A tile this narrow is what a mobile-width grid column produces (e.g. two tiles per row on a
 * phone). The actions slot is purely presentational — it renders whatever `actions` node it is
 * given — so it is the caller's job to cap how many render inline at that width (`ButtonsStack`'s
 * `maxVisible`, or `SchemaButtons`' `maxVisibleButtons`) rather than let them overflow past the
 * card edge. `SchemaImages` does this by capping `maxVisibleButtons` per breakpoint.
 *
 * The two tiles below share the same 3 icon-only actions but a different `maxVisible`, showing
 * `useOverflowCount`'s "no pointless collapse" rule: on an icon-only row the `⋮` trigger is the
 * same width as any one action, so hiding just one behind it (`maxVisible={2}`) buys back no space
 * — it renders all 3 inline instead. Only a cap that hides **two or more** (`maxVisible={1}`) is an
 * actual saving, so that one still collapses.
 */
export const Narrow: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      align={'flex-start'}
      items={
        [
          {key: 'no-saving', label: 'maxVisible=2 (no saving — shows all 3)', maxVisible: 2},
          {key: 'real-saving', label: 'maxVisible=1 (real saving — collapses)', maxVisible: 1},
        ] as const
      }
      keyOf={(i) => i.key}
      label={(i) => i.label}
      render={(i) => (
        <Box sx={{width: 160}}>
          <ImagePanel
            src={SAMPLE_SRC}
            hoverable={false}
            actions={
              <ButtonsStack
                surface={'iconButton'}
                maxVisible={i.maxVisible}
                buttons={NARROW_ACTION_DEFS}
              />
            }
          />
        </Box>
      )}
    />
  ),
};

/** The `info` chip across the palette colors. */
export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <VariantGrid
        align={'flex-start'}
        items={SHOWCASE_COLORS.filter(Boolean) as NonNullable<(typeof SHOWCASE_COLORS)[number]>[]}
        keyOf={(c) => c}
        label={(c) => c}
        render={(c) => (
          <Box sx={{width: 200}}>
            <ImagePanel src={SAMPLE_SRC} info={c} infoColor={c} hoverable={false} />
          </Box>
        )}
      />
    </Showcase>
  ),
};

/** A `src` that fails to load falls back to a centered broken-image icon instead of the
 * browser's default broken-image rendering. */
export const BrokenImage: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 260}}>
      <ImagePanel src={'https://example.invalid/missing.png'} actions={<SampleActions />}>
        <SampleCaption />
      </ImagePanel>
    </Box>
  ),
};
