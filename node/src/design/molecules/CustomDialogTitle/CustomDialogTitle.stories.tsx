import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {DialogContent, Paper, Theme, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {Section, Showcase, padDecorator} from '../../_storyKit';
import {IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {CustomDialogTitle} from './CustomDialogTitle';

// Generated once at module load so the body stays stable while playing with the Controls.
const BODY_TEXT = new LoremIpsum().generateSentences(3);

const noop = () => {};

/** The canonical header actions: an "Edit" button plus a `⋮` overflow menu (Duplicate / Archive). */
const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Duplicate', icon: IconType.Add, onClick: noop},
  {label: 'Archive', icon: IconType.Delete, color: 'error', onClick: noop},
];

const HeaderActions = () => (
  <ButtonsStack
    surface={'button'}
    variant={'contained'}
    size={'small'}
    maxVisible={1}
    buttons={HEADER_ACTIONS}
  />
);

/**
 * A dialog-paper-like surface so the header reads in its real context — a plain `Paper`, not a
 * real `Dialog`: an actual `Dialog` here would be a functioning modal (portal, focus trap, scroll
 * lock), which breaks scrolling/interaction on the very docs page meant to show it off.
 *
 * The theme's dialog padding overrides (`MuiDialog`'s `styleOverrides.root`, see
 * `theme/core/components/Dialog.tsx` — a baseline `padding-bottom: 0` on the title, and a reduced
 * `padding-top` on the content right after it) are compiled scoped to the *specific* `Dialog`
 * instance's own generated class, not the static `MuiDialog-root` name, so a `Paper` standing in
 * for the dialog paper can't inherit them via a lookalike class. Mirroring the same two rules here
 * (via `sx`, at the same specificity MUI's own compiled rule uses — an ancestor class plus a
 * descendant static class) reproduces the effect without a live modal: since this `Paper` renders
 * before its `CustomDialogTitle` child, this baseline is inserted first, so the child's own
 * `actions`/`divider` padding-bottom override (same specificity) still correctly wins over it,
 * exactly like the real theme rule does inside a real `Dialog`.
 */
const DIALOG_SURFACE_SX = {
  width: 720,
  position: 'relative' as const,
  '& .MuiDialogTitle-root': {paddingBottom: 0},
  '& .MuiDialogTitle-root + .MuiDialogContent-root': {paddingTop: (t: Theme) => t.spacing(2)},
};

const DialogSurface = ({children}: {children: React.ReactNode}) => (
  <Paper elevation={0} sx={DIALOG_SURFACE_SX}>
    {children}
  </Paper>
);

type PlaygroundArgs = {
  title: string;
  subtitle: string;
  actions: boolean;
  divider: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'design/molecules/CustomDialogTitle',
  component: CustomDialogTitle,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Standardized dialog header — a bold title, an optional muted subtitle and a right-aligned ' +
          'actions slot (e.g. an "Edit" button plus a `⋮` overflow menu), with an optional bottom ' +
          'divider (off by default). Rendered as a MUI `DialogTitle`, so it inherits the dialog-title ' +
          'padding (including the gutter that clears the floating close button) and composes MUI-style ' +
          'as the first child of a `CustomDialog`, before `DialogContent` / `DialogActions`.',
      },
    },
    controls: {include: ['title', 'subtitle', 'actions', 'divider']},
  },
  argTypes: {
    title: {control: 'text'},
    subtitle: {control: 'text'},
    actions: {control: 'boolean'},
    divider: {control: 'boolean'},
  },
  args: {
    title: 'New owner',
    subtitle: 'for property Jihlavská 521/62, Prague – Michle',
    actions: true,
    divider: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof CustomDialogTitle>;

/**
 * Interactive instance — drive the header props from the Controls panel. Shown on a dialog-paper-
 * like surface, as the first child of a `CustomDialog` (or any MUI `Dialog`), before `DialogContent`.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  render: ({title, subtitle, actions, divider}) => (
    <Paper elevation={0} sx={DIALOG_SURFACE_SX}>
      <CustomDialogTitle
        title={title}
        subtitle={subtitle || undefined}
        actions={
          actions ? (
            <ButtonsStack
              surface={'button'}
              variant={'contained'}
              size={'small'}
              maxVisible={1}
              buttons={HEADER_ACTIONS}
            />
          ) : undefined
        }
        divider={divider}
      />
      <DialogContent>
        <Typography variant={'body2'} color={'text.secondary'}>
          {BODY_TEXT}
        </Typography>
      </DialogContent>
    </Paper>
  ),
};

/** The header building blocks, one at a time. */
export const Anatomy: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => (
    <Showcase>
      {(
        [
          {title: 'Title only', node: <CustomDialogTitle title={'New owner'} />},
          {
            title: 'Title + subtitle',
            node: (
              <CustomDialogTitle
                title={'New owner'}
                subtitle={'for property Jihlavská 521/62, Prague – Michle'}
              />
            ),
          },
          {
            title: 'With actions',
            node: (
              <CustomDialogTitle
                title={'New owner'}
                subtitle={'for property Jihlavská 521/62, Prague – Michle'}
                actions={<HeaderActions />}
              />
            ),
          },
          {
            title: 'With divider',
            node: (
              <CustomDialogTitle
                title={'New owner'}
                subtitle={'for property Jihlavská 521/62, Prague – Michle'}
                actions={<HeaderActions />}
                divider
              />
            ),
          },
          {
            title: 'Long title (wraps — actions stay pinned to the first line)',
            node: (
              <CustomDialogTitle
                title={
                  'A very long dialog title that does not fit on a single line and has to wrap'
                }
                actions={<HeaderActions />}
              />
            ),
          },
        ] as const
      ).map(({title, node}) => (
        <Section key={title} title={title}>
          <DialogSurface>{node}</DialogSurface>
        </Section>
      ))}
    </Showcase>
  ),
};
