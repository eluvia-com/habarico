import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';
import {SocialIcon} from './SocialIcon';
import {SocialIconType} from './enums';

const ICONS = Object.values(SocialIconType);
const SIZES = ['small', 'medium', 'large'] as const;

const meta: Meta<typeof SocialIcon> = {
  title: 'design/atoms/SocialIcon',
  component: SocialIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Brand icon for a social network, keyed by `icon: SocialIconType`. Built on the MUI ' +
          '`SvgIcon`, so `fontSize` and `color` behave as usual. Use the Playground to pick a network.',
      },
    },
    controls: {include: ['icon', 'fontSize', 'color']},
  },
  argTypes: {
    icon: {control: 'select', options: ICONS},
    fontSize: {control: 'inline-radio', options: SIZES},
    color: {
      control: 'select',
      // Built on MUI `SvgIcon`, so `color` is that fixed semantic palette — not a free string —
      // same as every other `SvgIcon`-based atom here (`Icon`).
      options: [
        'inherit',
        'action',
        'disabled',
        'primary',
        'secondary',
        'error',
        'info',
        'success',
        'warning',
      ],
    },
  },
  args: {icon: SocialIconType.Facebook, fontSize: 'medium'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SocialIcon>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Icons: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={ICONS}
      keyOf={(i) => i}
      label={(i) => i}
      render={(i) => <SocialIcon icon={i} />}
    />
  ),
};

export const Sizes: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SIZES}
      keyOf={(s) => s}
      label={(s) => s}
      render={(s) => <SocialIcon icon={SocialIconType.GitHub} fontSize={s} />}
    />
  ),
};
