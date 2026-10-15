// Upload transport contract + result/option shapes. Extracted so `upload.ts` (orchestration) and
// `chunked.ts` (transport) both depend only on this module and never on each other, keeping the
// folder free of circular imports.

// The minimal shape the low-level uploader needs to drive a chunked S3-multipart or tus upload.
// Schema-free: the schema layer declares its own `UploadFieldOptions` wire type which stays *structurally*
// compatible with this one, so neither layer imports the other. The bidirectional-assignability guard
// in `src/schema/__tests__/uploadOptions.contract.test-d.ts` fails typecheck if they drift apart.
export type UploadTransportConfig = {
  provider: 's3-multipart' | 'tus';
  /** Files at/above this byte size use the chunked provider; smaller ones are sent as base64. */
  threshold: number;
  /** Multipart part size in bytes; also the tus chunk size. */
  chunkSize: number;
  /** s3-multipart only; S3 hard minimum part size (the multipart vs. single-PUT boundary). */
  minChunkSize?: number;
  /** s3-multipart only; presigned initiate URL (already carries `?model=…&field=…`). */
  initiateUrl?: string;
  /** tus only; upload endpoint. */
  endpoint?: string;
};

/** Result of the base64 path: the file encoded inline, sent later with the record's form submit. */
export type Base64UploadResult = {
  url: string;
  filename: string;
  content: string;
};

/** Result of the chunked path: a reference key to the already out-of-band uploaded object. */
export type ChunkedUploadResult = {upload_key: string};

export type FileUploadResult = ChunkedUploadResult | Base64UploadResult;

export type UploadFileOptions = {
  /** Transport for the chunked path. When absent (or the file is below its threshold) the file is
   *  encoded as base64 instead. */
  transport?: UploadTransportConfig;
  getAuthHeaders: () => Record<string, string>;
  onProgress?: (pct: number) => void;
};

/** A running upload: its result promise plus an `abort()`. */
export type UploadHandle<T = FileUploadResult> = {
  promise: Promise<T>;
  abort: () => void;
};
