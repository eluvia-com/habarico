import {getChunkedUploadTransport} from './registry';
import type {Base64UploadResult, UploadFileOptions, UploadHandle} from './types';

// Upload orchestration: turn a picked `File` into the value stored in the record's field. Schema-free
// — see `./types` for the transport contract.

/** Builds the base64 result from a Data URI. */
const buildBase64Result = (file: File, dataUrl: string): Base64UploadResult => {
  let encoded = dataUrl.replace(/^data:(.*,)?/, '');
  if (encoded.length % 4 > 0) {
    encoded += '='.repeat(4 - (encoded.length % 4));
  }
  return {
    url: dataUrl,
    filename: file.name,
    content: encoded,
  };
};

/**
 * Reads a file and encodes it as base64 (`{url, filename, content}`). Purely local — no network
 * request; the encoded payload is sent later, inline in the record's form submit.
 */
const encodeFileBase64 = (file: File): Promise<Base64UploadResult> => {
  return new Promise<Base64UploadResult>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(buildBase64Result(file, reader.result?.toString() || ''));
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Resolves a picked `File` into the value stored in the record's field, returning a handle with the
 * result promise and an abort function. Large files (a `transport` is set and the file reaches its
 * threshold) are uploaded out-of-band via the transport registered with
 * `registerChunkedUploadTransport`, yielding an `upload_key` reference. Everything else is encoded
 * inline as base64 and rides along in the record's normal form submit — there is no separate
 * network request on that path.
 *
 * When the schema asks for a chunked upload but no transport is registered, the returned handle
 * rejects rather than silently falling back to base64: a file past its threshold is precisely the
 * one that must not be inlined into the form submit. The handle rejects instead of throwing so the
 * upload queue reports it on the offending entry (`useUploadQueue` calls this outside its `try`).
 *
 * The file arrives already transformed: resize/crop is applied when the file is stored into the
 * field (`applyFileModifier` in `useUploadQueue`), so both paths upload the same bytes and the
 * threshold below compares the size that will actually be stored.
 */
export const uploadFile = (file: File, options: UploadFileOptions): UploadHandle => {
  if (options.transport && file.size >= options.transport.threshold) {
    const transport = getChunkedUploadTransport();
    if (!transport) {
      return {
        promise: Promise.reject(
          new Error(
            `Cannot upload "${file.name}": the schema requires a chunked upload, but no transport ` +
              'is registered. Install the "habarico-enterprise" package, or register your own ' +
              'transport with registerChunkedUploadTransport().'
          )
        ),
        abort: () => {},
      };
    }
    return transport(file, {...options, transport: options.transport});
  }
  let active = true;
  return {
    promise: encodeFileBase64(file).then((data) => {
      if (!active) throw new Error('aborted');
      return data;
    }),
    abort: () => {
      active = false;
    },
  };
};
