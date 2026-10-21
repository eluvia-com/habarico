import React, {useEffect, useRef, useState} from 'react';
import {InputHelperText, Validator, useInput} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {useUploadingContext} from '@admin/contexts/UploadingContext';
import {useUploadAreaLabels} from '@admin/hooks/useUploadAreaLabels';
import {UploadEntry, useUploadQueue} from '@admin/hooks/useUploadQueue';
import {InputLayout} from '@design/molecules/InputLayout';
import {UploadArea, UploadAreaLabels} from '@design/organisms/UploadArea';
import {useFileModifier} from '@foundation/hooks/useFileModifier';
import {UploadTransportConfig} from '@foundation/utils/upload';
import {FileData} from './types';

// Deliberately does NOT extend the shared admin `InputProps`: this is a highly specialized
// file-upload field whose surface (`maxFiles`, `accept`, `maxFileSize`, `upload`, `resizeWidth`,
// `cropAspectRatio`, image preview, upload-area labels) has almost no overlap with the standard
// text/select inputs. The schema mapping lives in `defaultInputProvider`'s `uploadInputProps`.
export type UploadInputProps = {
  source: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  validate?: Validator | Validator[];
  /** Stretch the field frame to the container width. Defaults to `true`. */
  fullWidth?: boolean;
  readOnly?: boolean;
  /**
   * Cap on the number of files. `1` makes this a single-value field (emits one `FileData` object);
   * any other value (including unset = unlimited) makes it a multi-value array field.
   */
  maxFiles?: number;
  accept?: string[];
  /** Maximum allowed file size in bytes. */
  maxFileSize?: number;
  upload?: UploadTransportConfig;
  resizeWidth?: number;
  cropAspectRatio?: number;
  showImagePreview?: boolean;
  /** Override the upload UI strings. Defaults to translations of `ra.upload_files.*`. */
  labels?: UploadAreaLabels;
};

export const UploadInput = ({
  helperText,
  source,
  label,
  validate,
  fullWidth = true,
  readOnly,
  maxFiles,
  accept,
  maxFileSize,
  upload,
  resizeWidth,
  cropAspectRatio,
  showImagePreview,
  labels: labelsProp,
}: UploadInputProps) => {
  // A single-value field is exactly a one-file cap; everything else (including unlimited) is an array.
  const isMulti = maxFiles !== 1;
  const defaultLabels = useUploadAreaLabels();

  // A failed row keeps the field invalid. The queue's own errors never reach the form value - a
  // rejected file is simply not stored - so without this the form would submit as if the user had
  // never picked that file. Read through a ref because the validator is registered before the
  // queue below exists, and re-read on every run so it always sees the current rows.
  const failedCountRef = useRef(0);
  const validateUploads: Validator = () =>
    failedCountRef.current > 0 ? 'ra.upload_files.unresolved_errors' : undefined;

  const {
    field: {onChange, value},
    fieldState: {error, invalid},
  } = useInput({
    source,
    validate: validate
      ? [...(Array.isArray(validate) ? validate : [validate]), validateUploads]
      : validateUploads,
  });

  const fileModifier = useFileModifier(resizeWidth, cropAspectRatio);

  // Computed once on mount via useState lazy initializer:
  // initial queue entries and a pre-populated results map so that notifyOnChange
  // includes pre-existing files from the start.
  const [initialData] = useState(() => {
    const map = new Map<string, FileData>();

    if (isMulti) {
      const arr: FileData[] = Array.isArray(value) ? (value as FileData[]) : [];
      const entries: UploadEntry[] = arr
        .filter((v) => v.rawFile || v.filename || v.content || v.url)
        .map((v, i) => {
          const id = `existing-${i}`;
          map.set(id, v);
          return {
            id,
            file: v.rawFile,
            filename: v.rawFile?.name ?? v.filename ?? '',
            fileSize: v.rawFile?.size,
            progress: null,
            error: null,
            previewUrl: showImagePreview ? v.url : undefined,
          };
        });
      return {entries, map};
    }

    const v = (value ?? {}) as FileData;
    if (!(v.rawFile || v.filename || v.content || v.url))
      return {entries: [] as UploadEntry[], map};
    return {
      entries: [
        {
          id: 'existing',
          file: v.rawFile,
          filename: v.rawFile?.name ?? v.filename ?? '',
          fileSize: v.rawFile?.size,
          progress: null,
          error: null,
          previewUrl: showImagePreview ? v.url : undefined,
        },
      ],
      map,
    };
  });

  // resultsRef mirrors completed upload results synchronously so notifyOnChange
  // can read all results without waiting for React state to settle.
  // Pre-populated with pre-existing entries so they survive subsequent changes.
  const resultsRef = useRef(initialData.map);

  const notifyOnChange = () => {
    const results = Array.from(resultsRef.current.values());
    if (isMulti) {
      onChange(results.length > 0 ? results : null);
    } else {
      onChange(results[0] ?? null);
    }
  };

  const uploadingContext = useUploadingContext();
  const [instanceId] = useState(() => crypto.randomUUID());

  const {entries, busyCount, addAndUpload, removeEntry, removeAll, retryUpload} = useUploadQueue({
    upload,
    maxFileSize,
    accept,
    showPreview: showImagePreview,
    fileModifier,
    initialEntries: initialData.entries,
    onUploadSuccess: (id, uploadData) => {
      resultsRef.current.set(id, uploadData as FileData);
      notifyOnChange();
    },
  });

  // The field value does not change when a row fails, so nothing would re-run the validator on its
  // own. Trigger it whenever the number of failed rows changes - not on every entry change, which
  // would fire on each progress tick, and not on mount, which would surface a `required` error
  // before the user has touched anything.
  const {trigger} = useFormContext();
  const failedCount = entries.filter((e) => e.error != null).length;
  const previousFailedCount = useRef(failedCount);
  useEffect(() => {
    failedCountRef.current = failedCount;
    if (previousFailedCount.current !== failedCount) {
      previousFailedCount.current = failedCount;
      void trigger(source);
    }
  }, [failedCount, trigger, source]);

  // `busyCount`, not just the rows with a progress bar: the transform and the inline upload report
  // no percentage, and the save button must wait for those too - otherwise the record can be saved
  // while a file the user picked is still on its way into the field.
  useEffect(() => {
    uploadingContext?.registerUploading(instanceId, busyCount);
  }, [uploadingContext, instanceId, busyCount]);
  useEffect(
    () => () => {
      uploadingContext?.registerUploading(instanceId, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleAddFiles = (files: File[]) => {
    if (readOnly) return;
    addAndUpload(files);
  };

  const handleRemove = (id: string) => {
    if (readOnly) return;
    resultsRef.current.delete(id);
    removeEntry(id);
    notifyOnChange();
  };

  const handleRemoveAll = () => {
    resultsRef.current.clear();
    removeAll();
    onChange(null);
  };

  const handleRetry = (id: string) => {
    if (readOnly) return;
    resultsRef.current.delete(id);
    notifyOnChange();
    retryUpload(id);
  };

  const labels: UploadAreaLabels = labelsProp ?? defaultLabels;

  return (
    <InputLayout
      label={label}
      error={invalid}
      disabled={readOnly}
      fullWidth={fullWidth}
      // Only render the helper row when there's an error or an explicit helperText — otherwise RA's
      // `InputHelperText` emits a zero-width space that would keep an empty `MuiFormHelperText-root`
      // reserving vertical space, offsetting this input from the others (which drop the empty row).
      helperText={
        invalid || (helperText != null && helperText !== false) ? (
          <InputHelperText error={error?.message} helperText={helperText} />
        ) : undefined
      }
    >
      <UploadArea
        items={entries}
        onAddFiles={handleAddFiles}
        onRemoveItem={handleRemove}
        onRetryItem={handleRetry}
        onRemoveAll={isMulti && entries.length > 1 ? handleRemoveAll : undefined}
        accept={accept}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        disabled={readOnly}
        labels={labels}
        noBorder
      />
    </InputLayout>
  );
};
