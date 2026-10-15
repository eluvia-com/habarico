import React from 'react';
import {Form, PasswordInput, required, useAuthProvider, useTranslate} from 'react-admin';
import {PropertyFormLayout} from '@admin/components/views/PropertyFormLayout';
import {useSubmitForm} from '@admin/hooks/useSubmitForm';
import {ServiceAuthProvider} from '@admin/providers/types';
import {LoadingButton} from '@design/atoms/LoadingButton';
import {CustomDialog} from '@design/molecules/CustomDialog';
import {CustomDialogTitle} from '@design/molecules/CustomDialogTitle';
import {DialogActions, DialogContent, Divider} from '@mui/material';

type FormValues = {
  oldPassword?: string;
  newPassword?: string;
  newPasswordAgain?: string;
};

export type ChangePasswordDialogProps = {
  /** Whether the dialog is open. Injected by `AdminDashboardLayout` when used as the account slot. */
  open?: boolean;
  /** Closes the dialog — also called after a successful submit. Injected by the layout. */
  onClose?: () => void;
};

/**
 * The account "change password" dialog: a `CustomDialog` whose form changes the signed-in user's
 * password through `useAuthProvider<ServiceAuthProvider>().changePassword`. It owns the *whole*
 * dialog — header, form and the footer Save button — so a consumer overriding `BaseAdmin`'s
 * `changePassword` (or `SchemaAdmin`'s `ChangePasswordComponent`) slot replaces the entire dialog,
 * not just its form; the Save button lives directly in the `DialogActions` footer instead of being
 * portaled there. The layout owns the `open` state and injects `open` / `onClose`; a successful
 * submit calls `onClose`.
 */
export const ChangePasswordDialog = ({open = false, onClose}: ChangePasswordDialogProps) => {
  const translate = useTranslate();
  const authProvider = useAuthProvider<ServiceAuthProvider>();

  if (!authProvider) {
    throw new Error('No authProvider found in context');
  }

  // --------------------------------------------------------------------------
  // Handler
  // --------------------------------------------------------------------------

  const submitData = (data: FormValues) => {
    return authProvider.changePassword({
      oldPassword: data.oldPassword || '',
      newPassword: data.newPassword || '',
    });
  };

  const {handleSubmit, isLoading} = useSubmitForm(
    submitData,
    onClose,
    undefined,
    'ra.auth.change_password_success',
    'ra.auth.change_password_error'
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <CustomDialogTitle
        title={translate('ra.auth.change_password')}
        subtitle={translate('ra.auth.change_password_subtitle')}
      />
      <Form onSubmit={handleSubmit}>
        <DialogContent>
          <PropertyFormLayout orientation="vertical">
            <PasswordInput
              autoFocus
              source="oldPassword"
              label="ra.auth.old_password"
              disabled={isLoading}
              validate={required()}
              autoComplete={'off'}
              size="small"
            />
          </PropertyFormLayout>
          <Divider sx={{my: 3}} />
          <PropertyFormLayout orientation="vertical">
            <PasswordInput
              source="newPassword"
              label="ra.auth.new_password"
              disabled={isLoading}
              validate={required()}
              autoComplete={'off'}
              size="small"
            />
            <PasswordInput
              source="newPasswordAgain"
              label="ra.auth.password_again"
              disabled={isLoading}
              autoComplete={'off'}
              size="small"
              validate={[
                required(),
                (value, allValues) =>
                  value !== (allValues as FormValues).newPassword
                    ? translate('ra.auth.password_mismatch')
                    : undefined,
              ]}
            />
          </PropertyFormLayout>
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

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- component displayName, not a credential
ChangePasswordDialog.displayName = 'ChangePasswordDialog';
