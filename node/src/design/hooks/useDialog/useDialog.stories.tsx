import {LoremIpsum} from 'lorem-ipsum';
import React from 'react';
import {Button, DialogActions, DialogContent, Dialog as MuiDialog, Typography} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../_storyKit';
import {Icon, IconType} from '../../atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '../../molecules/ButtonsStack';
import {CustomDialogTitle} from '../../molecules/CustomDialogTitle';
import {useDialog} from './useDialog';

const noop = () => {};

/** Header actions: an "Edit" button plus a `⋮` overflow menu (Duplicate / Archive). */
const HEADER_ACTIONS: ButtonDefinition[] = [
  {label: 'Edit', icon: IconType.Edit, onClick: noop},
  {label: 'Duplicate', icon: IconType.Add, onClick: noop},
  {label: 'Archive', icon: IconType.Delete, color: 'error', onClick: noop},
];

const meta: Meta<typeof MuiDialog> = {
  title: 'design/hooks/useDialog',
  component: MuiDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Modal surface rendered over a backdrop, opened imperatively via the design-layer ' +
          '`useDialog` hook. Click the button to open it.',
      },
    },
    // `component` is the underlying MUI `Dialog`, and this story never reads args — without this,
    // Storybook auto-infers a full, entirely dead argTypes table.
    controls: {include: []},
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof MuiDialog>;

// Generated once at module load so the body stays stable across re-renders.
const BODY_TEXT = new LoremIpsum().generateSentences(3);

// "Show code" only serializes the JSX `render` returns, never the `useDialog()` call itself, and
// the `Dialog` it returns is an anonymous `useMemo` component (no `displayName`), so it'd otherwise
// print as `<Component>`.
const buildDefaultSource = () => `const {Dialog, openDialog} = useDialog();

<>
  <Button variant="contained" onClick={() => openDialog()}>
    Open dialog
  </Button>
  <Dialog maxWidth="sm" fullWidth>
    <CustomDialogTitle
      title="New owner"
      subtitle="for property Jihlavská 521/62, Prague – Michle"
      actions={
        <ButtonsStack
          surface="button"
          variant="contained"
          size="small"
          maxVisible={1}
          buttons={headerActions}
        />
      }
    />
    <DialogContent>
      <Typography variant="body2">{bodyText}</Typography>
    </DialogContent>
    <DialogActions>
      <Button color="inherit" startIcon={<Icon icon={IconType.Close} size={18} />}>
        Cancel
      </Button>
      <Button variant="contained" color="success">
        Save
      </Button>
    </DialogActions>
  </Dialog>
</>`;

/**
 * The standardized header: compose `CustomDialogTitle` (bold title, muted subtitle, right-aligned
 * actions) as the first child of the returned `Dialog`. Works with the default `'custom'` variant —
 * no configuration needed beyond dropping the header in.
 */
export const Default: Story = {
  parameters: {docs: {source: {transform: (_code: string) => buildDefaultSource()}}},
  render: (_args) => {
    const {Dialog, openDialog} = useDialog();
    return (
      <>
        <Button variant={'contained'} onClick={() => openDialog()}>
          Open dialog
        </Button>
        <Dialog maxWidth={'sm'} fullWidth>
          <CustomDialogTitle
            title={'New owner'}
            subtitle={'for property Jihlavská 521/62, Prague – Michle'}
            actions={
              <ButtonsStack
                surface={'button'}
                variant={'contained'}
                size={'small'}
                maxVisible={1}
                buttons={HEADER_ACTIONS}
              />
            }
          />
          <DialogContent>
            <Typography variant={'body2'}>{BODY_TEXT}</Typography>
          </DialogContent>
          <DialogActions>
            <Button color={'inherit'} startIcon={<Icon icon={IconType.Close} size={18} />}>
              Cancel
            </Button>
            <Button variant={'contained'} color={'success'}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  },
};
