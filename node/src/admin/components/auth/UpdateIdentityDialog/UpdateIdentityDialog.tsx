import React, {useState} from 'react';
import {
  Form,
  TextInput,
  required,
  useAuthProvider,
  useGetIdentity,
  useNotify,
  useTranslate,
} from 'react-admin';
import {PropertyFormLayout} from '@admin/components/views/PropertyFormLayout';
import {useSubmitForm} from '@admin/hooks/useSubmitForm';
import {ServiceAuthProvider} from '@admin/providers/types';
import {AvatarField} from '@design/atoms/AvatarField';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {CustomDialog} from '@design/molecules/CustomDialog';
import {CustomDialogTitle} from '@design/molecules/CustomDialogTitle';
import {cropImage, resizeImage} from '@foundation/utils/image';
import {DialogActions, DialogContent, Stack} from '@mui/material';

export type UpdateIdentityDialogProps = {
  /** Whether the dialog is open. Injected by `AdminDashboardLayout` when used as the account slot. */
  open?: boolean;
  /** Closes the dialog — also called after a successful submit. Injected by the layout. */
  onClose?: () => void;
};

/**
 * The account "update identity" dialog: a `CustomDialog` whose form updates the signed-in user's
 * identity through `useAuthProvider<ServiceAuthProvider>().updateIdentity`. It owns the *whole*
 * dialog — header, form and the footer Save button — so a consumer overriding `BaseAdmin`'s
 * `updateIdentity` (or `SchemaAdmin`'s `UpdateIdentityComponent`) slot replaces the entire dialog,
 * not just its form; the Save button lives directly in the `DialogActions` footer instead of being
 * portaled there. The layout owns the `open` state and injects `open` / `onClose`; a successful
 * submit calls `onClose`.
 *
 * The form fields live inside `<Form>`, a child of `CustomDialog`, so MUI mounts them fresh each
 * time the dialog opens — `defaultValues` are therefore always reseeded from the (by-then loaded)
 * identity.
 */
export const UpdateIdentityDialog = ({open = false, onClose}: UpdateIdentityDialogProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const authProvider = useAuthProvider<ServiceAuthProvider>();
  const {identity, refetch: refetchIdentity} = useGetIdentity();

  if (!authProvider) {
    throw new Error('No authProvider found in context');
  }

  // --------------------------------------------------------------------------
  // Avatar
  // --------------------------------------------------------------------------

  // `avatarOverride` holds an unsaved pick or removal; until the user touches the avatar we show the
  // signed-in identity's. Unlike the text fields (which live inside `<Form>` and so remount —
  // reseeding from `identity` — every time MUI mounts the dialog content on open), this state lives
  // above the dialog and would otherwise carry a discarded edit into the next open, so we clear it
  // when the dialog opens — the render-phase reset React recommends over an effect for "adjust state
  // when a prop changes" (https://react.dev/learn/you-might-not-need-an-effect).
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [avatarFilename, setAvatarFilename] = useState<string>('');
  const avatar = avatarOverride ?? identity?.avatar ?? '';

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAvatarOverride(null);
      setAvatarFilename('');
    }
  }

  const onAvatarSelectFiles = (files: File[], changeValue: (value: string) => void) => {
    if (files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = async () => {
        const fileType = files[0].type;
        const resized = await resizeImage(reader.result as string, fileType, 300);
        const cropped = await cropImage(resized, fileType);
        changeValue(cropped);
        setAvatarFilename(files[0].name);
      };
      reader.onerror = () => {
        notify('ra.notification.upload_error', {type: 'error'});
      };
    }
  };

  // --------------------------------------------------------------------------
  // Handler
  // --------------------------------------------------------------------------

  const composeDataAndSubmit = async (data: Record<string, number | string>) => {
    await authProvider.updateIdentity({
      ...data,
      ...(avatar && avatarFilename ? {avatarFilename, avatarContent: avatar.split(',')[1]} : {}),
    });
    // authProvider.updateIdentity() only updates @eluvia/auth's own store; react-admin's
    // useGetIdentity() cache must be refetched explicitly or the header keeps showing stale data.
    await refetchIdentity();
  };
  const {handleSubmit, isLoading} = useSubmitForm(
    composeDataAndSubmit,
    onClose,
    undefined,
    'ra.auth.update_identity_success',
    'ra.auth.update_identity_error'
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <CustomDialogTitle
        title={translate('ra.auth.update_identity')}
        subtitle={translate('ra.auth.update_identity_subtitle')}
      />
      <Form
        onSubmit={handleSubmit}
        noValidate
        defaultValues={{
          firstName: identity?.firstName,
          lastName: identity?.lastName,
          email: identity?.email,
        }}
      >
        <DialogContent sx={{pt: '8px !important'}}>
          <Stack direction={'row'} spacing={2} alignItems={'flex-start'}>
            <AvatarField
              value={avatar}
              onChange={(e) => setAvatarOverride(e.target.value)}
              onSelectFiles={onAvatarSelectFiles}
              addLabel={translate('ra.auth.add_avatar')}
              removeLabel={translate('ra.auth.remove_avatar')}
              changeLabel={translate('ra.auth.change_avatar')}
            />
            <Stack spacing={2} sx={{flex: 1, minWidth: 0}}>
              <PropertyFormLayout orientation="vertical">
                <TextInput
                  autoFocus
                  source="email"
                  label="ra.auth.email"
                  disabled={isLoading}
                  validate={required()}
                  size="small"
                />
              </PropertyFormLayout>
              <PropertyFormLayout orientation="vertical" columns={2}>
                <TextInput
                  source="firstName"
                  label="ra.auth.first_name"
                  disabled={isLoading}
                  size="small"
                />
                <TextInput
                  source="lastName"
                  label="ra.auth.last_name"
                  disabled={isLoading}
                  size="small"
                />
              </PropertyFormLayout>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size="medium"
            type="submit"
            color="primary"
            variant="contained"
            loading={isLoading}
          >
            {translate('ra.action.save')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </CustomDialog>
  );
};

UpdateIdentityDialog.displayName = 'UpdateIdentityDialog';
