import React from 'react';
import {Box, Button, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {COLOR_TYPES, Section, Showcase, VariantGrid, padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {Panel} from '../Panel';
import {PanelContent} from '../PanelContent';
import {PanelHeader} from './PanelHeader';

const ICON_OPTIONS = [IconType.House, IconType.Key, IconType.Warning, IconType.CreditCard] as const;

const noop = () => {};

const ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
  {label: 'Share', icon: IconType.Handshake, onClick: noop},
];

/** Placeholder body used to show the header in a full panel. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    Panel body. Compose any content here via <code>PanelContent</code>.
  </Typography>
);

/** A three-dot overflow menu — the canonical actions slot (all actions collapsed into the menu). */
const MenuAction = () => <ButtonsStack surface={'iconButton'} maxVisible={0} buttons={ACTIONS} />;

/** Several icon buttons side by side with a `⋮` overflow — via `ButtonsStack`. */
const MultiActions = () => <ButtonsStack surface={'iconButton'} maxVisible={2} buttons={ACTIONS} />;

type PlaygroundArgs = {
  label: string;
  icon: IconType;
  iconColor: (typeof COLOR_TYPES)[number];
  iconBadge: boolean;
  help: string;
  showStatus: boolean;
  actions: boolean;
  collapsible: boolean;
  loading: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/PanelHeader',
  component: PanelHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The header slot of a `Panel`: an optional leading colored icon (a tinted badge by ' +
          'default), a label, an optional help tooltip, an optional status indicator (a soft ' +
          'tinted chip with a colored icon and the status text in a tooltip) and a right-aligned ' +
          'actions slot. When the surrounding `Panel` is `collapsible` it also renders the collapse ' +
          'toggle, and it can show an optional drag handle. Must be rendered inside a `Panel`. ' +
          'Built on MUI `CardHeader`.',
      },
    },
    controls: {
      include: [
        'label',
        'icon',
        'iconColor',
        'iconBadge',
        'help',
        'showStatus',
        'actions',
        'collapsible',
        'loading',
      ],
    },
  },
  argTypes: {
    label: {control: 'text'},
    icon: {control: 'select', options: ICON_OPTIONS},
    iconColor: {control: 'select', options: COLOR_TYPES},
    iconBadge: {control: 'boolean'},
    help: {control: 'text'},
    showStatus: {control: 'boolean'},
    actions: {control: 'boolean'},
    collapsible: {control: 'boolean'},
    loading: {control: 'boolean'},
  },
  args: {
    label: 'Basic properties',
    icon: IconType.House,
    iconColor: 'primary',
    iconBadge: true,
    help: 'Basic properties of the record.',
    showStatus: true,
    actions: true,
    collapsible: false,
    loading: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof PanelHeader>;

/**
 * Interactive instance — drive the header props from the Controls panel. `showStatus` is a
 * story-only boolean switch: the real `status` prop takes a `{label, color, icon}` object a
 * Controls widget can't usefully build, so the switch just turns a fixed demo status on/off.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({
    label,
    icon,
    iconColor,
    iconBadge,
    help,
    showStatus,
    actions,
    collapsible,
    loading,
  }) => (
    <Box sx={{maxWidth: 460}}>
      <Panel collapsible={collapsible}>
        <PanelHeader
          label={label}
          icon={icon}
          iconColor={iconColor}
          iconBadge={iconBadge}
          help={help || undefined}
          status={
            showStatus ? {label: 'Active', color: 'success', icon: IconType.LockPerson} : undefined
          }
          actions={
            actions ? (
              <ButtonsStack surface={'iconButton'} maxVisible={0} buttons={ACTIONS} />
            ) : undefined
          }
          loading={loading}
        />
        <PanelContent>
          <SampleBody />
        </PanelContent>
      </Panel>
    </Box>
  ),
};

/** The header building blocks, added one at a time. */
export const Anatomy: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {(
        [
          {title: 'Label only', node: <PanelHeader label={'Label only'} />},
          {
            title: 'Leading icon (tinted badge)',
            node: <PanelHeader label={'With icon'} icon={IconType.House} />,
          },
          {
            title: 'Bare colored icon',
            node: (
              <PanelHeader
                label={'Bare icon'}
                icon={IconType.Warning}
                iconColor={'warning'}
                iconBadge={false}
              />
            ),
          },
          {
            title: 'Help tooltip',
            node: (
              <PanelHeader
                label={'With help'}
                icon={IconType.Key}
                help={'Explains this section.'}
              />
            ),
          },
          {
            title: 'Status indicator (colored icon; label in a tooltip)',
            node: (
              <PanelHeader
                label={'With status'}
                icon={IconType.Description}
                status={{label: 'Active', color: 'success', icon: IconType.Check}}
              />
            ),
          },
          {
            title: 'Actions slot',
            node: (
              <PanelHeader
                label={'With actions'}
                icon={IconType.CreditCard}
                actions={<MenuAction />}
              />
            ),
          },
          {
            title: 'Multiple action buttons',
            node: (
              <PanelHeader
                label={'With multiple actions'}
                icon={IconType.List}
                actions={<MultiActions />}
              />
            ),
          },
          {
            title: 'Everything',
            node: (
              <PanelHeader
                label={'Overdue contracts'}
                icon={IconType.Warning}
                iconColor={'error'}
                help={'Contracts past their due date.'}
                actions={
                  <Button size={'small'} endIcon={<Icon icon={IconType.ChevronRight} size={16} />}>
                    More
                  </Button>
                }
              />
            ),
          },
          {
            title: 'Long label (wraps — icon, help and actions pinned to the first line)',
            node: (
              <PanelHeader
                label={'A very long panel title that does not fit on a single line and has to wrap'}
                icon={IconType.Description}
                help={
                  'A wrapped label grows the header; the other elements stay on the first line.'
                }
                actions={<MenuAction />}
              />
            ),
          },
          {
            title: 'Loading (indeterminate bar on the bottom edge — an absolute overlay, no shift)',
            node: (
              <PanelHeader
                label={'Publishing advertisement…'}
                icon={IconType.CreditCard}
                actions={<MenuAction />}
                loading
              />
            ),
          },
        ] as const
      ).map(({title, node}) => (
        <Section key={title} title={title}>
          <Box sx={{width: 460}}>
            <Panel>{node}</Panel>
          </Box>
        </Section>
      ))}
    </Showcase>
  ),
};

/** The leading icon badge tint across the semantic palette colors. */
export const IconColors: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={COLOR_TYPES}
      keyOf={(c) => c}
      label={(c) => c}
      render={(c) => (
        <Box sx={{width: 280}}>
          <Panel>
            <PanelHeader label={c} icon={IconType.House} iconColor={c} />
          </Panel>
        </Box>
      )}
    />
  ),
};

/** The status indicator's soft tint across the semantic palette colors (hover for the label). */
export const Statuses: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={COLOR_TYPES}
      keyOf={(c) => c}
      label={(c) => c}
      render={(c) => (
        <Box sx={{width: 280}}>
          <Panel>
            <PanelHeader label={c} status={{label: c, color: c, icon: IconType.LockPerson}} />
          </Panel>
        </Box>
      )}
    />
  ),
};
