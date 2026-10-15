import React, {MouseEventHandler, useCallback, useContext} from 'react';
import {setSubmissionErrors, useNotify, useSaveContext} from 'react-admin';
import {useFormContext, useFormState} from 'react-hook-form';
import {FieldValues} from 'react-hook-form';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {AdminConfigContext} from '@admin/contexts/AdminConfigContext';
import {useUploadingContext} from '@admin/contexts/UploadingContext';
import {Icon, IconType} from '@design/atoms/Icon';
import {UseMutationOptions} from '@tanstack/react-query';
import {DataType} from '@typing';

export type SaveButtonProps = ActionButtonProps & {
  data?: DataType;
  transform?: (data: DataType) => DataType;
  mutationOptions?: UseMutationOptions;
};

// Rendered only once a form provider is guaranteed to exist (see `SaveButton` below).
const SaveButtonContent = ({
  data,
  color = 'primary',
  onClick,
  mutationOptions,
  label = 'ra.action.save',
  icon = <Icon icon={IconType.Check} />,
  ...props
}: SaveButtonProps) => {
  const notify = useNotify();
  const form = useFormContext();
  const saveContext = useSaveContext();
  const uploadingContext = useUploadingContext();
  const {isSubmitting, isLoading, isDirty} = useFormState();
  // Read without `useAdminConfig` so the button still renders in a form outside an admin root.
  const alwaysEnable = useContext(AdminConfigContext)?.alwaysEnableSaveButton ?? false;

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const defaultTransform = data ? (value: DataType) => ({...value, ...data}) : undefined;
  const {transform = defaultTransform, ...rest} = props;

  const handleError = useCallback(
    (error: Error) => {
      const fallbackMessage = error instanceof Error ? error.message : undefined;
      const errorMessage = typeof error === 'string' ? error : fallbackMessage;
      notify(
        typeof error === 'string'
          ? error
          : (error as Error).message || 'ra.notification.http_error',
        {
          type: 'error',
          messageArgs: {_: errorMessage},
        }
      );
    },
    [notify]
  );

  const handleSubmit = useCallback(
    async (values: FieldValues) => {
      let errors;

      // Clear previous errors and notifications
      form.clearErrors();
      if (saveContext?.save) {
        errors = await saveContext.save(values, {
          onError: handleError,
          ...mutationOptions,
          transform,
        });
      }
      if (errors != null) {
        setSubmissionErrors(errors, form.setError);
      }
    },
    [form, saveContext, mutationOptions, transform, handleError]
  );

  const handleClick: MouseEventHandler<HTMLElement> = useCallback(
    async (event) => {
      if (onClick) {
        onClick(event);
      }
      if (event.defaultPrevented) {
        return;
      }
      // Validate at click time instead of gating the button on `formState`. An error can outlive
      // the condition that produced it - a cross-field rule whose *other* field has since been
      // corrected, or a `type: 'server'` error left over from the previous submission - and a
      // disabled button would then leave the form permanently unsubmittable with nothing the user
      // could do about it. `trigger()` recomputes every field against the current values, so a
      // stale error clears itself and only a genuinely invalid form is stopped. Server-side errors
      // never block on their own: the field's own validation decides, and a retry stays possible.
      if (!(await form.trigger())) {
        notify('ra.message.invalid_form', {type: 'warning'});
        return;
      }
      handleSubmit(form.getValues()).then();
    },
    [onClick, form, handleSubmit, notify]
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Validation state is not part of this: `handleClick` runs `form.trigger()` before submitting.
  const isSaveButtonDisabled =
    (!isDirty && !alwaysEnable) ||
    isSubmitting ||
    isLoading ||
    saveContext.saving ||
    !!uploadingContext?.isUploading;

  return (
    <ActionButton
      color={color}
      label={label}
      icon={icon}
      {...rest}
      disabled={isSaveButtonDisabled}
      onClick={handleClick}
    />
  );
};

export const SaveButton = (props: SaveButtonProps) => {
  // A show view has no form context, so there is nothing to save. When the button is
  // placed there by mistake, render nothing instead of crashing - the actual button
  // relies on form hooks (useFormState) that throw without a form provider, and hooks
  // cannot be called conditionally, so the guard lives in this thin wrapper.
  const form = useFormContext();
  if (!form) return null;

  return <SaveButtonContent {...props} />;
};
