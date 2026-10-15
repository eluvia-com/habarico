// Design-layer view-model for the upload UI. Purely presentational: the `UploadArea` organism is
// fully controlled and renders a list of these items. Richer layers (admin `UploadEntry`) extend
// this shape with queue-internal fields — `UploadArea` only ever reads what is declared here.
export type UploadFileItem = {
  id: string;
  filename: string;
  fileSize?: number;
  previewUrl?: string;
  /** null = idle / finished, 0–100 = upload in progress. */
  progress: number | null;
  /**
   * Work is under way but reports no percentage - the image transform, or an inline upload, which
   * is encoded in one go. Distinct from `progress` so the row can say what is actually happening
   * instead of claiming a stuck 0 %.
   */
  processing?: boolean;
  error?: string | null;
  /** true once the file has been uploaded to storage — drives the "Complete" indicator. */
  uploaded?: boolean;
};

/**
 * Row/drop-zone density — scales the gap between file rows, each row's padding and the drop zone's
 * padding, with the same `'compact' | 'standard' | 'comfortable'` semantics as `FormTable` /
 * `DataTable`, so a global density setting passes straight through.
 */
export type UploadAreaDensity = 'compact' | 'standard' | 'comfortable';

// i18n contract: every user-facing string the upload UI renders. The design layer ships EN
// defaults (`DEFAULT_UPLOAD_AREA_LABELS`); richer layers inject translated labels via the
// `labels` prop so no string is hardcoded here.
export type UploadAreaLabels = {
  clickToUpload: string;
  orDragAndDrop: string;
  removeAll: string;
  /** `count` is how many more files may still be added. */
  filesRemainingHint: (count: number) => string;
  /** `size` is pre-formatted (e.g. via `formatBytes`). */
  maxFileSizeHint: (size: string) => string;
  uploading: string;
  processing: string;
  uploadComplete: string;
  tryAgain: string;
};

export const DEFAULT_UPLOAD_AREA_LABELS: UploadAreaLabels = {
  clickToUpload: 'Click to upload',
  orDragAndDrop: 'or drag and drop',
  removeAll: 'Remove all',
  filesRemainingHint: (count) => `${count} files remaining`,
  maxFileSizeHint: (size) => `max. ${size}`,
  uploading: 'Uploading…',
  processing: 'Processing…',
  uploadComplete: 'Complete',
  tryAgain: 'Try again',
};
