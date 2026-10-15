---
title: useUploadQueue
sidebar_position: 2
---

Manages a queue of files being uploaded, choosing base64 or a chunked provider per file.

It is what [UploadInput](../input-components/upload-input.mdx) runs on. Use it directly only when
you build your own upload UI and still want chunked uploads, retries and progress.

The hook is free. It resolves the chunked path through the core's transport registry, which
`habarico-enterprise` fills — or which you can fill yourself, see
[File uploads](/concepts/guides/file-uploads#supplying-your-own-transport).

## Signature

```typescript
import {useUploadQueue, type BuildFileModifier} from '@eluvia/habarico';

const {entries, addAndUpload, removeEntry, removeAll, retryUpload, updateEntry, getUploadErrorMsg} =
  useUploadQueue({
    upload,           // UploadTransportConfig | undefined — undefined means base64 only
    maxFileSize,      // number | undefined
    showPreview,      // boolean — default true
    fileModifier,     // BuildFileModifier | undefined
    initialEntries,   // UploadEntry[]
    onUploadSuccess,  // (id, uploadData) => void
  });
```

## Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `upload` | `UploadTransportConfig` | — | Chunked-upload config; without it every file goes the base64 route. Structurally identical to the schema's `UploadFieldOptions`, so `field.options.upload` can be passed straight in |
| `maxFileSize` | `number` | — | Files above this size are rejected before anything is sent |
| `showPreview` | `boolean` | `true` | Stores a preview URL on the entry |
| `fileModifier` | `BuildFileModifier` | — | Factory returning a transform applied to the data URL (resize, crop) |
| `initialEntries` | `UploadEntry[]` | `[]` | Pre-existing files, e.g. what the record already has |
| `onUploadSuccess` | `(id, uploadData) => void` | — | Called per finished file |

## Returns

| Name | Type | Description |
|---|---|---|
| `entries` | `UploadEntry[]` | The queue, in insertion order |
| `addAndUpload` | `(files: File[]) => void` | Adds files and starts uploading immediately |
| `removeEntry` | `(id: string) => void` | Aborts the upload if running, then drops the entry |
| `removeAll` | `() => void` | Aborts everything and clears the queue |
| `retryUpload` | `(id: string) => void` | Retries one failed entry |
| `updateEntry` | `(id: string, patch: UploadEntryPatch) => void` | Advanced: patches `progress`, `error`, `previewUrl`, `filename`, `uploaded`, `uploadResult`, `isChunkedUpload` or `done` |
| `getUploadErrorMsg` | `(e: unknown) => string` | Translated message for a caught upload error |

### `UploadEntry`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Queue identifier |
| `file` | `File \| undefined` | Absent for entries loaded from the backend |
| `filename` | `string` | File name |
| `fileSize` | `number \| undefined` | Absent for entries loaded from the backend |
| `progress` | `number \| null` | `0`–`100` during a chunked upload, `null` otherwise |
| `isChunkedUpload` | `boolean` | Whether this file took the chunked path |
| `error` | `string \| null` | Failure message |
| `uploaded` | `boolean \| undefined` | `true` once the file reached storage — drives the "Complete" indicator |
| `previewUrl` | `string \| undefined` | Set for base64 uploads only — a chunked upload has no viewable URL until the record is saved |
| `uploadResult` | `object \| undefined` | `{upload_key}` for chunked, `{filename, content}` for base64 |
| `done` | `boolean` | Upload finished successfully |

## Behaviour

- A file reaching `upload.threshold` takes the chunked path when `upload` is set; smaller files are
  base64-encoded. With no chunked transport registered, that file fails with an explanatory error
  instead of falling back to base64.
- `fileModifier` runs on the base64 path only — a chunked upload sends the raw file.
- Uploads in flight are aborted when the component unmounts.
- `tus` uploads retry with back-off; `s3-multipart` does not resume across a page reload.

## See also

- [UploadInput](../input-components/upload-input.mdx) — the component built on this hook
- [Chunked uploads](/python/chunked-uploads/) — configuring a provider on the backend
