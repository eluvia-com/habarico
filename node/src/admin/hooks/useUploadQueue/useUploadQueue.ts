import {useEffect, useRef, useState} from 'react';
import {useAuthProvider, useTranslate} from 'react-admin';
import {ServiceAuthProvider} from '@admin/providers/types';
import type {UploadFileItem} from '@design/organisms/UploadArea';
import {BuildFileModifier} from '@foundation/hooks/useFileModifier';
import {applyFileModifier, isFileAccepted} from '@foundation/utils/file';
import {UploadTransportConfig, uploadFile} from '@foundation/utils/upload';

const NO_AUTH_HEADERS = () => ({});

// Admin-layer upload queue entry: the design view-model (`UploadFileItem`) plus the queue-internal
// bookkeeping the design layer never sees. Structurally assignable to `UploadFileItem`, so entries
// can be passed straight to `UploadArea`.
export type UploadEntry = UploadFileItem & {
  file?: File; // absent for backend-loaded entries
  /** The file as the user picked it, before any transform - what a retry starts over from. */
  pickedFile?: File;
  /** Result of uploadFile — set after upload completes, before dataProvider.create. */
  uploadResult?: Record<string, unknown>;
  /** true if the file is uploaded via the chunked provider (>= threshold). */
  isChunkedUpload?: boolean;
  /** true after a successful retry-create (entry stays in list but is no longer counted as ready). */
  done?: boolean;
};

export type UploadEntryPatch = Partial<
  Pick<
    UploadEntry,
    | 'progress'
    | 'error'
    | 'previewUrl'
    | 'file'
    | 'filename'
    | 'fileSize'
    | 'uploaded'
    | 'uploadResult'
    | 'processing'
    | 'isChunkedUpload'
    | 'done'
  >
>;

export type UseUploadQueueOptions = {
  upload?: UploadTransportConfig;
  /** Maximum allowed size in bytes of the *stored* file, i.e. checked after the modifier ran. */
  maxFileSize?: number;
  /** Allowed extensions (".png"), mime types or wildcards ("image/*"), checked after the modifier ran. */
  accept?: string[];
  /** Whether to store the upload preview URL on the entry. Defaults to true. */
  showPreview?: boolean;
  /** Factory receiving the File, returns an optional dataUrl transformer (e.g. resize/crop). */
  fileModifier?: BuildFileModifier;
  initialEntries?: UploadEntry[];
  /** Called after each successful upload. */
  onUploadSuccess?: (id: string, uploadData: Record<string, unknown>) => void;
  /** Headers attached to each upload request. Defaults to `authProvider.getAuthHeaders`, or no
   *  headers when neither is set. */
  getAuthHeaders?: () => Record<string, string>;
};

export type UseUploadQueueResult = {
  entries: UploadEntry[];
  /** Rows with work under way — a transform or an upload. Non-zero means "do not submit yet". */
  busyCount: number;
  addAndUpload: (files: File[]) => void;
  removeEntry: (id: string) => void;
  removeAll: () => void;
  retryUpload: (id: string) => void;
  updateEntry: (id: string, patch: UploadEntryPatch) => void;
  getUploadErrorMsg: (e: unknown) => string;
};

export const useUploadQueue = ({
  upload,
  maxFileSize,
  accept,
  showPreview = true,
  fileModifier,
  initialEntries = [],
  onUploadSuccess,
  getAuthHeaders,
}: UseUploadQueueOptions): UseUploadQueueResult => {
  const translate = useTranslate();
  // useAuthProvider() returns undefined outside an admin root (e.g. in isolation or tests) instead
  // of throwing, so no defensive context read is needed here.
  const authProvider = useAuthProvider<ServiceAuthProvider>();
  const resolvedGetAuthHeaders = getAuthHeaders ?? authProvider?.getAuthHeaders ?? NO_AUTH_HEADERS;
  const [entries, setEntries] = useState<UploadEntry[]>(initialEntries);
  const abortMap = useRef(new Map<string, () => void>());

  useEffect(
    () => () => {
      abortMap.current.forEach((abort) => abort());
    },
    []
  );

  const addFiles = (files: File[]): string[] => {
    const newEntries: UploadEntry[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      pickedFile: file,
      filename: file.name,
      fileSize: file.size,
      previewUrl: undefined,
      progress: null,
      error: null,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    return newEntries.map((e) => e.id);
  };

  const updateEntry = (id: string, patch: UploadEntryPatch) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? {...e, ...patch} : e)));
  };

  const startUpload = async (id: string, file: File) => {
    const isChunkedUpload = !!(upload && file.size >= upload.threshold);
    // The inline path encodes the file in one go and reports nothing along the way, so it shows as
    // `processing`; only the chunked transport has real percentages to report.
    updateEntry(id, {
      progress: isChunkedUpload ? 0 : null,
      processing: !isChunkedUpload,
      error: null,
      isChunkedUpload,
    });
    const {promise, abort} = uploadFile(file, {
      transport: upload,
      getAuthHeaders: resolvedGetAuthHeaders,
      onProgress: (pct) => updateEntry(id, {progress: pct}),
    });
    abortMap.current.set(id, abort);
    try {
      const result = await promise;
      abortMap.current.delete(id);
      const {url, ...uploadData} = result as {url?: string; [key: string]: unknown};
      updateEntry(id, {
        progress: null,
        processing: false,
        uploaded: true,
        uploadResult: uploadData,
        ...(showPreview && url ? {previewUrl: url} : {}),
      });
      onUploadSuccess?.(id, uploadData);
    } catch (e) {
      abortMap.current.delete(id);
      if ((e as Error).message === 'aborted') return;
      updateEntry(id, {progress: null, processing: false, error: getUploadErrorMsg(e)});
    }
  };

  const getUploadErrorMsg = (e: unknown): string => {
    if (e instanceof Error) return e.message;
    return translate('ra.upload_files.upload_error');
  };

  /** Returns the translated reason the file's type is not allowed, or `null` when it passes. */
  const validateFileType = (file: File): string | null =>
    accept && !isFileAccepted(file, accept)
      ? translate('ra.upload_files.file_type_not_allowed')
      : null;

  /** Returns the translated reason the file is too big, or `null` when it passes. */
  const validateFileSize = (file: File): string | null =>
    maxFileSize != null && file.size > maxFileSize
      ? translate('ra.upload_files.file_too_large')
      : null;

  // Check the type, transform, validate again, then upload. The modifier decides the file's final
  // size, type and name, so the authoritative pass runs after it - that is what lets `maxFileSize`,
  // `accept` and the chunked-vs-base64 threshold judge the bytes that actually get stored - while
  // the type is also checked up front, on the picked file. The entry is created up front (in
  // `addAndUpload`) so the row appears the moment the file is dropped, and is patched once the
  // transform resolves, so the row shows the size and name that will actually be stored.
  const prepareAndUpload = async (id: string, picked: File) => {
    // Type first, on the file as picked: a file of the wrong kind is wrong before any transform can
    // change that, and running it through the canvas anyway would report it as a processing failure
    // instead of naming the real problem. Size is deliberately not checked here - the modifier is
    // what decides the final size.
    const pickedError = validateFileType(picked);
    if (pickedError) {
      updateEntry(id, {error: pickedError});
      return;
    }

    // The transform reads and re-encodes the file, which takes long enough to be visible on a large
    // photo. Mark the row busy for its duration so it does not sit there looking idle - and so the
    // form cannot be saved while the file it is waiting for has not been stored yet.
    updateEntry(id, {processing: true, error: null});

    let file: File;
    try {
      file = await applyFileModifier(picked, fileModifier?.(picked));
    } catch {
      updateEntry(id, {
        processing: false,
        error: translate('ra.upload_files.image_processing_failed'),
      });
      return;
    }
    updateEntry(id, {file, filename: file.name, fileSize: file.size});

    // Re-checked after the transform: it can change the size, the mime type and the extension.
    const error = validateFileType(file) ?? validateFileSize(file);
    if (error) {
      updateEntry(id, {processing: false, error});
      return;
    }
    await startUpload(id, file);
  };

  const addAndUpload = (files: File[]) => {
    const ids = addFiles(files);
    ids.forEach((id, i) => void prepareAndUpload(id, files[i]));
  };

  const removeEntry = (id: string) => {
    abortMap.current.get(id)?.();
    abortMap.current.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const removeAll = () => {
    abortMap.current.forEach((abort) => abort());
    abortMap.current.clear();
    setEntries([]);
  };

  const retryUpload = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry?.file || entry.progress !== null) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {...e, progress: null, error: null, uploaded: false, uploadResult: undefined}
          : e
      )
    );
    // Start over from the picked file rather than resuming at the upload: an entry can be sitting
    // on an error precisely *because* it failed a check or failed to transform, and resuming would
    // upload the very file that was rejected. Re-running the transform on a retry costs one more
    // canvas pass, which is the cheaper half of the trade.
    void prepareAndUpload(id, entry.pickedFile ?? entry.file);
  };

  const busyCount = entries.filter((e) => e.progress !== null || e.processing).length;

  return {
    entries,
    busyCount,
    addAndUpload,
    removeEntry,
    removeAll,
    retryUpload,
    updateEntry,
    getUploadErrorMsg,
  };
};
