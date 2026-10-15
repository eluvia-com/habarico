import {useBlocker, useCanBlock} from 'ra-core';
import React, {useEffect} from 'react';
import {useFormState} from 'react-hook-form';
import {UnsavedChangesDialog} from '@admin/components/dialogs/UnsavedChangesDialog';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {useUnsavedChangesControl} from '@admin/contexts/UnsavedChangesContext';

// Separated into its own component so useBlocker is only called when the router supports it.
// useBlocker throws when used outside a data router, so this component must not render otherwise.
const FormBlocker = ({shouldBlock}: {shouldBlock: boolean}) => {
  const blocker = useBlocker(shouldBlock);

  if (blocker.state !== 'blocked') return null;

  return (
    <UnsavedChangesDialog open onDiscard={() => blocker.proceed()} onStay={() => blocker.reset()} />
  );
};

export const FormNavigationGuard = () => {
  // isSubmitSuccessful turns true synchronously after a successful submit, before onSuccess fires.
  // This prevents useBlocker from intercepting the post-save redirect while isDirty is still true
  // (the form reset via new defaultValues happens asynchronously on the next render).
  const {isDirty, isSubmitSuccessful} = useFormState();
  const {setHasUnsavedChanges} = useUnsavedChangesControl();
  const {navigationGuard} = useAdminConfig();
  const canBlock = useCanBlock();

  useEffect(() => {
    setHasUnsavedChanges(isDirty && !isSubmitSuccessful);
  }, [isDirty, isSubmitSuccessful, setHasUnsavedChanges]);

  useEffect(() => {
    return () => setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  if (!canBlock) return null;

  return <FormBlocker shouldBlock={navigationGuard && isDirty && !isSubmitSuccessful} />;
};
