import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {SHOWCASE_COLORS, VariantGrid, padDecorator} from '../../_storyKit';
import {Icon} from './Icon';
import {IconType} from './enums';

const ICON_TYPES = Object.values(IconType);

// Icon sets the design system can render. Only `material` today; the union is the
// extension point for future sets.
const ICON_SETS = ['material'] as const;

// A curated sample of the full IconType set — enough to show the range without
// dumping every glyph.
const SAMPLE_ICONS = [
  IconType.Home,
  IconType.Search,
  IconType.Settings,
  IconType.AccountCircle,
  IconType.Notifications,
  IconType.Edit,
  IconType.Delete,
  IconType.Add,
  IconType.CheckCircle,
  IconType.Cancel,
  IconType.Warning,
  IconType.Visibility,
  IconType.Download,
  IconType.List,
  IconType.Group,
  IconType.Key,
] as const;

const meta: Meta<typeof Icon> = {
  title: 'design/atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic icon keyed by `IconType`, rendered from the active icon set (`theme.iconSet`, ' +
          'overridable per call via `iconSet`). Only `material` exists today — Material Design ' +
          'rounded glyphs — but the set is a pluggable extension point. Any raw ' +
          '`@mui/icons-material` name also works; `size` sets a square px size (or `width`/`height` ' +
          'per side), and `color`/`fontSize`/`sx` behave like a MUI `SvgIcon`.',
      },
    },
    controls: {include: ['icon', 'iconSet', 'size', 'color', 'fontSize']},
  },
  argTypes: {
    icon: {control: 'select', options: ICON_TYPES},
    iconSet: {control: 'inline-radio', options: ICON_SETS},
    size: {control: {type: 'number', min: 12, max: 96, step: 2}},
    color: {
      control: 'select',
      options: ['inherit', 'primary', 'secondary', 'info', 'success', 'warning', 'error'],
    },
    fontSize: {control: 'inline-radio', options: ['small', 'medium', 'large']},
  },
  args: {icon: IconType.Home, iconSet: 'material', fontSize: 'medium'},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Icon>;

/** Interactive instance — drive every prop from the Controls panel. */
export const Playground: Story = {};

export const Icons: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SAMPLE_ICONS}
      keyOf={(i) => i}
      label={(i) => i}
      render={(i) => <Icon icon={i} />}
    />
  ),
};

export const Colors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={SHOWCASE_COLORS}
      keyOf={(c) => c ?? 'default'}
      label={(c) => c ?? 'default'}
      render={(c) => <Icon icon={IconType.CheckCircle} color={c} />}
    />
  ),
};
