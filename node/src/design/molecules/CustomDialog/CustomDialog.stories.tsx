import {LoremIpsum} from 'lorem-ipsum';
import React, {useState} from 'react';
import {Button, DialogActions, DialogContent, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../ButtonsStack';
import {CustomDialogTitle} from '../CustomDialogTitle';
import {CustomDialog} from './CustomDialog';

// Generated once at module load so the body stays stable while playing with the Controls.
const BODY_TEXT = new LoremIpsum().generateParagraphs(1);

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

/** Button that opens a `CustomDialog` composed MUI-style (header + content + actions). */
const CustomDialogDemo = ({
  disableClose,
  width,
}: {
  disableClose?: boolean;
  width?: number | string;
}) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant={'contained'} onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <CustomDialog
        open={open}
        onClose={close}
        disableClose={disableClose}
        width={width}
        maxWidth={'sm'}
        fullWidth
      >
        <CustomDialogTitle
          title={'New owner'}
          subtitle={'for property Jihlavská 521/62, Prague – Michle'}
          actions={<HeaderActions />}
        />
        <DialogContent>
          <Typography variant={'body2'} color={'text.secondary'}>
            {BODY_TEXT}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color={'inherit'}
            startIcon={<Icon icon={IconType.Close} size={18} />}
            onClick={close}
          >
            Cancel
          </Button>
          <Button variant={'contained'} color={'success'} onClick={close}>
            Save
          </Button>
        </DialogActions>
      </CustomDialog>
    </>
  );
};

const meta: Meta<typeof CustomDialog> = {
  title: 'design/molecules/CustomDialog',
  component: CustomDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A controlled wrapper over the MUI `Dialog` that adds the standardized floating close button ' +
          '(unless `disableClose`) and otherwise keeps MUI’s composition contract: build the body ' +
          'from `CustomDialogTitle` / `DialogContent` / `DialogActions` children. The `open` state is ' +
          'owned by the caller (here a button; in the app usually the `useDialog` hook).',
      },
    },
    controls: {include: ['disableClose', 'width']},
  },
  argTypes: {
    disableClose: {control: 'boolean'},
    width: {
      control: 'text',
      description:
        'Exact paper width (px number or CSS length). Overrides `maxWidth` — leave empty to keep ' +
        'the `sm` breakpoint preset.',
    },
  },
  args: {
    disableClose: false,
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof CustomDialog>;

// `render` returns the local `CustomDialogDemo` helper (it owns the `open` state — see the "Hooks
// live in a top-level demo component" rule), so "Show code" would otherwise show that helper's tag
// instead of the real MUI-style composition. `docs.source.transform` rebuilds that real usage from
// the story's current args instead — reactive, unlike a static override.
const buildPlaygroundSource = ({
  disableClose,
  width,
}: {
  disableClose?: boolean;
  width?: number | string;
}) =>
  `<CustomDialog
  open={open}
  onClose={close}
  disableClose={${String(!!disableClose)}}
  maxWidth="sm"${width ? `\n  width={${JSON.stringify(width)}}` : ''}
  fullWidth
>
  <CustomDialogTitle
    title="New owner"
    subtitle="for property Jihlavská 521/62, Prague – Michle"
    actions={<ButtonsStack surface="button" variant="contained" size="small" maxVisible={1} buttons={headerActions} />}
  />
  <DialogContent>
    <Typography variant="body2" color="text.secondary">
      {bodyText}
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button color="inherit" startIcon={<Icon icon={IconType.Close} size={18} />} onClick={close}>
      Cancel
    </Button>
    <Button variant="contained" color="success" onClick={close}>
      Save
    </Button>
  </DialogActions>
</CustomDialog>`;

/** Interactive instance — open the dialog and toggle the props from the Controls panel. */
export const Playground: Story = {
  render: (args) => <CustomDialogDemo disableClose={args.disableClose} width={args.width} />,
  parameters: {
    docs: {
      source: {
        transform: (
          _code: string,
          {args}: {args: {disableClose?: boolean; width?: number | string}}
        ) => buildPlaygroundSource(args),
      },
    },
  },
};

/**
 * Exact paper width — `width={720}` pins `.MuiDialog-paper` to 720px, overriding the `sm` breakpoint
 * preset (which would otherwise cap it at 600px). Passing a plain number is the same value the schema
 * `dialogWidth` resolver forwards for a px width.
 */
export const ExactWidth: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: () => <CustomDialogDemo width={720} />,
};
