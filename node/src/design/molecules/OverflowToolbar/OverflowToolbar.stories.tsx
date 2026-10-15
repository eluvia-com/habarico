import React from 'react';
import {ListItemIcon, ListItemText, MenuItem, Tooltip} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {Button} from '../../atoms/Button';
import {Icon, IconType} from '../../atoms/Icon';
import {useToolbarSlot} from '../../contexts/ToolbarSlotContext';
import {OverflowToolbar} from './OverflowToolbar';

/**
 * A demo button that reads `useToolbarSlot` — exactly how the admin `ActionButton` does. In the
 * inline row it is a `Button` (icon-only when the toolbar forces it); in the `⋮` menu it is a
 * `MenuItem`. Kept at module top level (not inside a `render` arrow) so Storybook's code serializer
 * only ever sees the `<DemoButton />` tag, never re-invokes the hook outside the theme provider.
 */
const DemoButton = ({label, icon}: {label: string; icon: IconType}) => {
  const {inMenu, iconOnly} = useToolbarSlot();
  const glyph = <Icon icon={icon} size={20} />;

  if (inMenu) {
    return (
      <MenuItem>
        <ListItemIcon>{glyph}</ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </MenuItem>
    );
  }
  if (iconOnly) {
    return (
      <Tooltip title={label} arrow>
        <Button variant={'contained'} iconOnly aria-label={label}>
          {glyph}
        </Button>
      </Tooltip>
    );
  }
  return (
    <Button variant={'contained'} startIcon={glyph}>
      {label}
    </Button>
  );
};

const DEMO_CHILDREN = [
  <DemoButton key={'edit'} label={'Edit'} icon={IconType.Edit} />,
  <DemoButton key={'add'} label={'Duplicate'} icon={IconType.Add} />,
  <DemoButton key={'share'} label={'Share'} icon={IconType.Handshake} />,
  <DemoButton key={'delete'} label={'Archive'} icon={IconType.Delete} />,
];

const meta: Meta<typeof OverflowToolbar> = {
  title: 'design/molecules/OverflowToolbar',
  component: OverflowToolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A horizontal row of *directly rendered* button controls that collapses its surplus into a ' +
          '`⋮` overflow menu — the children-driven counterpart to `ButtonsStack` (which takes an ' +
          'button-object array). It never inspects or clones the children: `useOverflowCount` decides ' +
          'how many stay inline (a fixed `maxVisible` or a per-breakpoint map), and a ' +
          '`ToolbarSlotProvider` tells each slot, via context, whether it renders in the menu ' +
          '(→ a `menuItem`) and whether inline controls are icon-only. Any control that reads ' +
          '`useToolbarSlot` — the admin `ActionButton`, hence every schema button — participates.',
      },
    },
    controls: {
      include: ['maxVisible', 'iconOnly', 'minVisible'],
    },
  },
  argTypes: {
    maxVisible: {
      control: {type: 'number', min: 0},
      description:
        'Max inline controls before the surplus collapses into the `⋮` menu. `minVisible` is a ' +
        '**floor** on top of this: the actually-visible count is never lower than `minVisible`, ' +
        'even when `maxVisible` asks for fewer — so `maxVisible: 0` with the default `minVisible: 1` ' +
        'still shows one inline control, not zero.',
    },
    iconOnly: {control: 'boolean'},
    minVisible: {
      control: {type: 'number', min: 0},
      description:
        'Fewest inline controls kept when overflowing — a floor `maxVisible` can never go below. ' +
        'Defaults to `1`; lower it to `0` too if you want `maxVisible: 0` to actually collapse ' +
        'every control into the `⋮` menu.',
    },
  },
  args: {
    maxVisible: 3,
    iconOnly: false,
    minVisible: 1,
    more: {surface: 'button', size: 'medium'},
    children: DEMO_CHILDREN,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof OverflowToolbar>;

/** Interactive instance — drive the toolbar props from the Controls panel. */
export const Playground: Story = {};

/**
 * Responsiveness is **viewport-breakpoint** based (variant 2): it reacts only when `maxVisible` is a
 * per-breakpoint map and/or `iconOnly` is a breakpoint — a plain number / boolean (as in the Playground)
 * has nothing to switch on. **Resize the Storybook canvas** to watch the inline count fall (`{xs: 1, …,
 * lg: 4}`) and the labels drop below `sm` (`iconOnly="sm"`). Width-aware (container, not viewport)
 * collapsing is tracked in HAB-786.
 */
export const Responsive: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <OverflowToolbar maxVisible={{xs: 1, sm: 2, md: 3, lg: 4}} iconOnly={'sm'}>
      {DEMO_CHILDREN}
    </OverflowToolbar>
  ),
};

/** `maxVisible` = inline buttons; the `⋮` trigger is always extra. Collapses the tail into the menu. */
export const Overflow: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {[undefined, 3, 2, 1].map((max) => (
        <Section
          key={String(max)}
          title={max == null ? 'maxVisible: none (all inline)' : `maxVisible: ${max}`}
        >
          <OverflowToolbar maxVisible={max}>{DEMO_CHILDREN}</OverflowToolbar>
        </Section>
      ))}
    </Showcase>
  ),
};

/** `iconOnly` drops the inline labels; overflow menu items always keep theirs. */
export const IconOnly: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      <Section title={'iconOnly (all inline)'}>
        <OverflowToolbar iconOnly>{DEMO_CHILDREN}</OverflowToolbar>
      </Section>
      <Section title={'iconOnly + overflow'}>
        <OverflowToolbar iconOnly maxVisible={2}>
          {DEMO_CHILDREN}
        </OverflowToolbar>
      </Section>
    </Showcase>
  ),
};
