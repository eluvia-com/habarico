import React, {useEffect, useState} from 'react';
import {useRecordContext, useResourceContext} from 'react-admin';
import {useFormContext, useFormState} from 'react-hook-form';
import {DraftRestoreDialog} from '@admin/components/dialogs/DraftRestoreDialog';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {useDraftStore} from '@admin/hooks/useDraftStore';

const DraftControllerContent = () => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const recordId = record?.id != null ? String(record.id) : 'new';

  const {draft, saveDraft, clearDraft} = useDraftStore(resource ?? '', recordId);

  const {reset, watch} = useFormContext();
  const {isDirty, isSubmitSuccessful} = useFormState();

  // Initialize dialog as open when a draft already exists at mount time — avoids calling
  // setState inside a useEffect body, which the linter flags as cascading renders.
  const [dialogOpen, setDialogOpen] = useState(() => draft !== undefined);

  // Subscribed imperatively, not through `useWatch`: a draft backup needs the latest values, not a
  // render, and `useWatch` costs one per keystroke. `saveDraft` debounces the write itself (500ms),
  // so nothing here needs its own debounce either.
  useEffect(() => {
    if (dialogOpen) return;
    const subscription = watch((values) => {
      if (isDirty) saveDraft(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty, dialogOpen, saveDraft]);

  // Clear draft after successful save
  useEffect(() => {
    if (isSubmitSuccessful) {
      clearDraft();
    }
  }, [isSubmitSuccessful, clearDraft]);

  const handleRestore = () => {
    if (draft !== undefined) {
      reset(draft, {keepDefaultValues: true});
    }
    clearDraft();
    setDialogOpen(false);
  };

  const handleDiscard = () => {
    clearDraft();
    setDialogOpen(false);
  };

  return (
    <DraftRestoreDialog open={dialogOpen} onRestore={handleRestore} onDiscard={handleDiscard} />
  );
};

export const DraftController = () => {
  const {draftEnabled} = useAdminConfig();
  // Gated in a separate component, not an early `return null` here: `DraftControllerContent`'s hooks
  // (`useFormContext`, the form subscription, ...) must not run at all while the feature is off, or
  // every form pays the cost of watching itself on every keystroke for nothing — an early return
  // cannot skip hooks already called above it, only skipping the mount can.
  if (!draftEnabled) return null;
  return <DraftControllerContent />;
};
