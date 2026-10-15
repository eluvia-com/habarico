// Media types whose subtype is not the extension users know, or is not readable at all ("vnd.…", "x-…").
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/tab-separated-values': 'tsv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.oasis.opendocument.presentation': 'odp',
  'application/x-zip-compressed': 'zip',
  'application/gzip': 'gz',
  'application/x-7z-compressed': '7z',
  'application/vnd.rar': 'rar',
  'application/x-rar-compressed': 'rar',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-wav': 'wav',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

// Extensions that name the same format: each one shows the one shared label, so a user does not
// read "JPG" and "JPEG" as two different formats.
const EXTENSION_LABELS: Record<string, string> = {
  jpg: 'JPG (JPEG)',
  jpeg: 'JPG (JPEG)',
};

/** Resolves one `accept` entry to the extension it stands for: ".pdf" → "pdf", "image/jpeg" → "jpg". */
const acceptEntryExtension = (entry: string): string | undefined => {
  const value = entry.trim().toLowerCase();
  if (value.startsWith('.')) return value.slice(1) || undefined;
  if (value.endsWith('/*')) return undefined;
  if (MIME_EXTENSIONS[value]) return MIME_EXTENSIONS[value];
  const subtype = value.split('/')[1];
  return subtype && /^[a-z0-9]+$/.test(subtype) ? subtype : undefined;
};

/**
 * Names the format one `accept` entry stands for, as the extension users know: ".pdf" → "PDF",
 * "image/png" → "PNG", ".jpg" / ".jpeg" / "image/jpeg" → "JPG (JPEG)". A wildcard ("image/*")
 * names no concrete format and a media type without a readable subtype cannot be named - both
 * yield `undefined` and are left out of the hint, while the file check (`isFileAccepted`) still
 * honours them.
 */
const formatAcceptEntry = (entry: string): string | undefined => {
  const extension = acceptEntryExtension(entry);
  if (!extension) return undefined;
  return EXTENSION_LABELS[extension] ?? extension.toUpperCase();
};

/** Lists the formats an `accept` list names, each once, e.g. "PNG, JPG (JPEG), PDF"; `undefined` when none. */
export const formatAccept = (accept?: string[]): string | undefined => {
  if (!accept || accept.length === 0) return undefined;
  const labels = new Set(accept.map(formatAcceptEntry).filter((label) => label !== undefined));
  return labels.size ? [...labels].join(', ') : undefined;
};

export const joinHintParts = (...parts: (string | undefined)[]): string | undefined => {
  const filled = parts.filter(Boolean) as string[];
  return filled.length > 0 ? filled.join(' · ') : undefined;
};
