import type {FileModifier} from '@foundation/hooks/useFileModifier';
import {parseImageDataUrl} from './image';

// Pure client-side file helpers (name / type / size) plus the File-level application of a
// `FileModifier`. No API, no upload — see `@foundation/utils/upload` for upload orchestration.

/** Returns the lowercased file extension without the leading dot, or '' when there is none. */
export const getExt = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() ?? '';
};

/** Checks whether a File matches an `accept` list of extensions (".png"), mime types or wildcards ("image/*"). */
export const isFileAccepted = (file: File, accept: string[]): boolean => {
  const types = accept.map((t) => t.trim().toLowerCase());
  const ext = '.' + getExt(file.name);
  const mime = file.type.toLowerCase();
  return types.some((type) => {
    if (type.startsWith('.')) return ext === type;
    if (type.endsWith('/*')) return mime.startsWith(type.slice(0, -1));
    return mime === type;
  });
};

/** Formats a byte count as a human-readable string, e.g. "70 MB" or "512 KB". */
export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

/** Reads a file as a Data URI. */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() ?? '');
    reader.onerror = () => reject(reader.error ?? new Error(`Cannot read "${file.name}"`));
    reader.readAsDataURL(file);
  });

/** Decodes a base64 payload into a Blob of the given mime type. */
const base64ToBlob = (base64: string, type: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type});
};

/** Swaps the file extension, keeping a base name that itself contains dots intact. */
const withExtension = (filename: string, extension: string): string => {
  const dot = filename.lastIndexOf('.');
  return `${dot > 0 ? filename.slice(0, dot) : filename}.${extension}`;
};

/**
 * Applies a `FileModifier` (resize / crop) to a picked file and resolves to the transformed file.
 *
 * This runs when the file is stored into the field — before the size and type validations and
 * before the base64-vs-chunked routing decision — so every one of them sees the bytes that will
 * actually be stored rather than the raw pick.
 *
 * Without a modifier the original instance is returned untouched and never read, so a large
 * non-image file is never pulled into memory. The result's mime type comes from the produced Data
 * URI rather than from the input, because `canvas.toDataURL()` silently falls back to `image/png`
 * for a type it cannot encode; the extension follows so the stored name cannot contradict the
 * bytes (and cannot be rejected by its own `accept` list).
 */
export const applyFileModifier = async (file: File, modifier?: FileModifier): Promise<File> => {
  if (!modifier) return file;

  const dataUrl = await modifier(await readAsDataUrl(file));
  const {fileType, extension, base64} = parseImageDataUrl(dataUrl);
  const filename =
    fileType !== file.type && extension ? withExtension(file.name, extension) : file.name;

  return new File([base64ToBlob(base64, fileType)], filename, {type: fileType});
};
