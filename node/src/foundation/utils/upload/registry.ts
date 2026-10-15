import type {
  ChunkedUploadResult,
  UploadFileOptions,
  UploadHandle,
  UploadTransportConfig,
} from './types';

// Registry for the chunked upload transport. `upload.ts` (orchestration) resolves the transport
// through here instead of importing an implementation, so the free core carries only the base64
// path and the paid package registers the chunked one at import time. See `./types` for the
// transport contract itself.

/** A chunked transport: drives one file to completion out-of-band and yields its `upload_key`. */
export type ChunkedUploadTransport = (
  file: File,
  options: UploadFileOptions & {transport: UploadTransportConfig}
) => UploadHandle<ChunkedUploadResult>;

let registered: ChunkedUploadTransport | undefined;

/**
 * Registers the transport used for files at/above their `transport.threshold`. Registering again
 * replaces the previous one, so an application can substitute its own implementation.
 */
export const registerChunkedUploadTransport = (transport: ChunkedUploadTransport): void => {
  registered = transport;
};

/** The registered chunked transport, or `undefined` when none was registered. */
export const getChunkedUploadTransport = (): ChunkedUploadTransport | undefined => registered;
