import React, {useState} from 'react';
import {Box, Button, Stack, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {VariantGrid, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {PanelContent} from '../PanelContent';
import {PanelFooter} from '../PanelFooter';
import {PanelHeader} from '../PanelHeader';
import {Panel} from './Panel';

const noop = () => {};

const MENU_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Delete', icon: IconType.Delete, color: 'error', onClick: noop},
];

/** Placeholder body used across the showcases. */
const SampleBody = () => (
  <Typography variant={'body2'} color={'text.secondary'}>
    Panel body. Compose any content here via <code>PanelContent</code> — form fields, a datagrid, a
    chart, nested panels, and so on.
  </Typography>
);

/** A three-dot overflow menu — the canonical header actions slot, via `ButtonsStack`. */
const MenuAction = () => (
  <ButtonsStack surface={'iconButton'} maxVisible={0} buttons={MENU_ACTIONS} />
);

const meta: Meta<typeof Panel> = {
  title: 'design/molecules/Panel',
  component: Panel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The panel **shell** — the single container used to build detail/edit forms, nested ' +
          'lists, dashboard widgets and similar sections. It is a compound: compose `PanelHeader`, ' +
          '`PanelContent` and `PanelFooter` inside it. The `Panel` owns only the surface style — ' +
          '`root` (12px, paper, shadow) or `nested` (6px, default background, flat) — and the ' +
          'collapse state, shared with its slots via context. Drag and resize are built-in ' +
          'presentational affordances toggled by boolean props (no drag/resize logic). See ' +
          '`PanelHeader` / `PanelContent` / `PanelFooter` for the slots.',
      },
    },
    controls: {include: ['variant', 'collapsible', 'resizeHandle', 'emphasized']},
  },
  argTypes: {
    variant: {control: 'inline-radio', options: ['root', 'nested']},
    collapsible: {control: 'boolean'},
    resizeHandle: {control: 'boolean'},
    emphasized: {control: 'boolean'},
  },
  args: {variant: 'root', collapsible: false, resizeHandle: false, emphasized: false},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof Panel>;

/**
 * Interactive instance — drive the shell's props from the Controls panel. `Panel` itself has no
 * `actions`/`footer` prop — those come from composing `PanelHeader` (its own `actions` slot, with
 * its own Controls) and `PanelFooter` (`left`/`right` slots, see its Playground) inside it, as here
 * and in `WithFooter` below.
 */
export const Playground: Story = {
  render: ({variant, collapsible, resizeHandle, emphasized}) => (
    <Box sx={{maxWidth: 460}}>
      <Panel
        variant={variant}
        collapsible={collapsible}
        resizeHandle={resizeHandle}
        emphasized={emphasized}
      >
        <PanelHeader
          label={'Panel title'}
          icon={IconType.House}
          actions={<ButtonsStack surface={'iconButton'} maxVisible={0} buttons={MENU_ACTIONS} />}
        />
        <PanelContent>
          <SampleBody />
        </PanelContent>
      </Panel>
    </Box>
  ),
};

/** The two surface variants, and a `nested` panel composed inside a `root` one. */
export const Variants: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={['root', 'nested'] as const}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => (
        <Box sx={{width: 320}}>
          <Panel variant={v}>
            <PanelHeader
              label={v === 'root' ? 'Root panel' : 'Nested panel'}
              icon={IconType.House}
            />
            <PanelContent>
              {v === 'root' ? (
                <Stack spacing={2}>
                  <SampleBody />
                  <Panel variant={'nested'}>
                    <PanelHeader label={'Nested panel'} icon={IconType.Key} iconColor={'info'} />
                    <PanelContent>
                      <SampleBody />
                    </PanelContent>
                  </Panel>
                </Stack>
              ) : (
                <SampleBody />
              )}
            </PanelContent>
          </Panel>
        </Box>
      )}
    />
  ),
};

/**
 * Automatic variant — a bare `<Panel>` (no `variant` prop) picks its surface from context: a
 * root at the top level, `nested` once it sits inside another `Panel` (via `InsidePanelContext`).
 * Neither panel below sets `variant`; the inner one turns `nested` on its own. Pass `variant`
 * explicitly only to override this.
 */
export const AutoNested: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 360}}>
      <Panel>
        <PanelHeader label={'Root panel (auto)'} icon={IconType.House} />
        <PanelContent>
          <Stack spacing={2}>
            <SampleBody />
            <Panel>
              <PanelHeader label={'Nested panel (auto)'} icon={IconType.Key} iconColor={'info'} />
              <PanelContent>
                <SampleBody />
              </PanelContent>
            </Panel>
          </Stack>
        </PanelContent>
      </Panel>
    </Box>
  ),
};

/** Collapsible panel — the header toggle expands/collapses the body. */
const CollapsibleDemo = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Stack spacing={2} sx={{width: 460}}>
      <Typography variant={'caption'} color={'text.secondary'}>
        Controlled: {collapsed ? 'collapsed' : 'expanded'}
      </Typography>
      <Panel collapsible collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <PanelHeader label={'Controlled collapsible'} icon={IconType.List} />
        <PanelContent>
          <SampleBody />
        </PanelContent>
      </Panel>
      <Panel collapsible defaultCollapsed>
        <PanelHeader
          label={'Uncontrolled, starts collapsed'}
          icon={IconType.List}
          iconColor={'secondary'}
        />
        <PanelContent>
          <SampleBody />
        </PanelContent>
      </Panel>
    </Stack>
  );
};

export const Collapsible: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <CollapsibleDemo />,
};

/** With a `PanelFooter` — a form panel with cancel / save actions in the footer's right slot. */
export const WithFooter: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 460}}>
      <Panel>
        <PanelHeader label={'New owner'} icon={IconType.PersonAdd} />
        <PanelContent>
          <SampleBody />
        </PanelContent>
        <PanelFooter
          right={
            <>
              <Button variant={'text'} color={'inherit'}>
                Cancel
              </Button>
              <Button variant={'contained'}>Save</Button>
            </>
          }
        />
      </Panel>
    </Box>
  ),
};

/**
 * `emphasized` — a 2px `primary.main` inset outline on the surface plus an `action.hover` tint on
 * the header, to single a panel out (e.g. a selected or active section). Set once on `Panel`; the
 * header picks up the tint via context. The outline is an inset shadow, so it never resizes the
 * panel relative to its siblings. Works on both `root` and `nested` surfaces.
 */
export const Emphasized: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <VariantGrid
      items={['root', 'nested'] as const}
      keyOf={(v) => v}
      label={(v) => v}
      render={(v) => (
        <Box sx={{width: 320}}>
          <Panel variant={v} emphasized>
            <PanelHeader
              label={'Emphasized panel'}
              icon={IconType.CheckCircle}
              actions={<MenuAction />}
            />
            <PanelContent>
              <SampleBody />
            </PanelContent>
          </Panel>
        </Box>
      )}
    />
  ),
};

/** Built-in drag and resize affordances (visual only; wiring is the dashboard's job). */
export const Handles: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Box sx={{width: 460, height: 220}}>
      <Panel resizeHandle sx={{height: '100%'}}>
        <PanelHeader
          label={'Orders by client'}
          icon={IconType.BarChart}
          dragHandle
          actions={<MenuAction />}
        />
        <PanelContent>
          <SampleBody />
        </PanelContent>
      </Panel>
    </Box>
  ),
};
