// Public surface of the upload utility. Only the orchestration entry point, the transport registry
// and the types that appear in their signatures are exposed; URL derivation and the base64 helper
// are internal to the folder.
//
// No transport is registered here: the library ships the base64 path only. A chunked
// (S3 multipart / tus) transport registers itself through `registerChunkedUploadTransport`.
export {uploadFile} from './upload';
export {registerChunkedUploadTransport, getChunkedUploadTransport} from './registry';
export type {ChunkedUploadTransport} from './registry';
export type {
  UploadTransportConfig,
  UploadFileOptions,
  UploadHandle,
  Base64UploadResult,
  ChunkedUploadResult,
  FileUploadResult,
} from './types';
