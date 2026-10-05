import React, {useState} from 'react';
import {useDataProvider, useNotify, useRecordContext, useRefresh, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useUploadAreaLabels} from '@admin/hooks/useUploadAreaLabels';
import {useUploadQueue} from '@admin/hooks/useUploadQueue';
import {Icon, IconType} from '@design/atoms/Icon';
import {useDialog} from '@design/hooks/useDialog';
import {UploadArea} from '@design/organisms/UploadArea';
import {useFileModifier} from '@foundation/hooks/useFileModifier';
import {Button, CircularProgress, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import {DEFAULT_IMAGE_ACCEPT} from '@schema/components/inputs/constants';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {useGetTargetValues} from '@schema/hooks/useGetTargetValues';
import {UploadImagesActionParameters} from '@schema/types';
import {resourceKey} from '@schema/utils/resourceReference';

export type SchemaUploadImagesButtonProps = Omit<ActionButtonProps, 'type'> & {
  uploadImages?: UploadImagesActionParameters;
};

export const SchemaUploadImagesButton = ({
  uploadImages,
  ...props
}: SchemaUploadImagesButtonProps) => {
  const {
    reference,
    target,
    accept: acceptParam,
    resizeWidth,
    cropAspectRatio,
    maxSize,
    maxFiles,
    upload: uploadParam,
    data,
    imageField,
  } = uploadImages ?? {};

  // The action params rarely carry the upload/accept config; it lives on the target field's
  // schema (imageField.options). Fall back to it so the button matches the create form behaviour
  // (e.g. S3 multipart uploads instead of always base64).
  const {getMethodSchema} = useGetLocalResourceSchema({resource: resourceKey(reference)});
  const imageFieldOptions = imageField
    ? (getMethodSchema('post')?.fields ?? getMethodSchema('get')?.fields)?.find(
        (f) => f.name === imageField
      )?.options
    : undefined;
  const upload = uploadParam ?? imageFieldOptions?.upload;
  const accept = acceptParam ?? imageFieldOptions?.accept ?? DEFAULT_IMAGE_ACCEPT;

  const translate = useTranslate();
  const {Dialog, openDialog, closeDialog} = useDialog();
  const uploadResource = useResourceContext(resourceKey(reference));
  const contextTargetValues = useGetTargetValues();
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const refresh = useRefresh();
  const notify = useNotify();

  const [saving, setSaving] = useState(false);

  const uploadTargetValues = target && record ? {[target]: record.id} : contextTargetValues;

  const fileModifier = useFileModifier(resizeWidth, cropAspectRatio);
  const uploadLabels = useUploadAreaLabels();

  const {
    entries,
    addAndUpload,
    removeEntry,
    removeAll,
    retryUpload,
    updateEntry,
    getUploadErrorMsg,
  } = useUploadQueue({
    upload,
    maxFileSize: maxSize,
    accept,
    fileModifier,
  });

  const handleConfirm = async () => {
    if (!imageField) return;
    setSaving(true);
    let anyFailed = false;
    const readyEntries = entries.filter((e) => e.uploadResult && !e.error && !e.done);

    for (const entry of readyEntries) {
      try {
        await dataProvider.create(uploadResource, {
          data: {...data, ...uploadTargetValues, [imageField]: entry.uploadResult},
        });
        updateEntry(entry.id, {done: true});
      } catch (e) {
        updateEntry(entry.id, {error: getUploadErrorMsg(e)});
        anyFailed = true;
      }
    }

    setSaving(false);
    if (!anyFailed) {
      notify(translate('ra.upload_images.upload_success'), {type: 'success'});
      refresh();
      removeAll();
      closeDialog();
    }
  };

  const handleRetryEntry = async (id: string) => {
    if (!imageField) return;
    const entry = entries.find((e) => e.id === id);
    if (!entry || entry.progress !== null) return;

    if (entry.uploadResult) {
      // Upload succeeded, create failed — retry only the dataProvider.create step
      updateEntry(id, {error: null});
      setSaving(true);
      try {
        await dataProvider.create(uploadResource, {
          data: {...data, ...uploadTargetValues, [imageField]: entry.uploadResult},
        });
        updateEntry(id, {done: true});
        notify(translate('ra.upload_images.upload_success'), {type: 'success'});
        refresh();
      } catch (e) {
        updateEntry(id, {error: getUploadErrorMsg(e)});
      } finally {
        setSaving(false);
      }
    } else if (entry.file) {
      retryUpload(id);
    }
  };

  const anyUploading = entries.some((e) => e.progress !== null);
  const readyCount = entries.filter((e) => e.uploadResult && !e.done && !e.error).length;
  const isDisabled = saving || anyUploading;

  return (
    <>
      <ActionButton
        variant="text"
        size="medium"
        {...props}
        icon={props.icon ?? <Icon icon={IconType.AddPhotoAlternate} />}
        onClick={openDialog}
      />

      <Dialog maxWidth="sm" fullWidth disableClose={isDisabled}>
        <DialogTitle>{translate('ra.upload_images.dialog_title')}</DialogTitle>
        <DialogContent>
          <UploadArea
            items={entries}
            onAddFiles={addAndUpload}
            onRemoveItem={removeEntry}
            onRetryItem={handleRetryEntry}
            onRemoveAll={entries.length > 1 ? removeAll : undefined}
            accept={accept}
            maxFiles={maxFiles}
            maxFileSize={maxSize}
            disabled={isDisabled}
            labels={uploadLabels}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              removeAll();
              closeDialog();
            }}
            disabled={isDisabled}
          >
            {translate('ra.action.cancel')}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirm}
            disabled={readyCount === 0 || isDisabled}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving
              ? translate('ra.upload_images.uploading')
              : translate('ra.upload_images.upload_count', {count: readyCount})}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
