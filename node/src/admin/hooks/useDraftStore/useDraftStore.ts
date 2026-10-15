import {useCallback, useEffect, useRef} from 'react';
import {useStore} from 'react-admin';

const DEBOUNCE_MS = 500;
const MAX_LEAF_BYTES = 50 * 1024;

// Strips values that cannot be safely persisted to localStorage:
// - File/FileList objects are not JSON-serializable (would silently become {})
// - Strings over MAX_LEAF_BYTES are skipped to guard against base64-encoded file
//   content (images, attachments) exhausting the ~5 MB localStorage quota; these
//   fields will simply be empty when the draft is restored
export const prepareForDraft = (value: unknown): unknown => {
  if (value instanceof File || value instanceof FileList) return undefined;
  if (typeof value === 'string') {
    return new TextEncoder().encode(value).length > MAX_LEAF_BYTES ? undefined : value;
  }
  if (Array.isArray(value)) return value.map(prepareForDraft);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, prepareForDraft(v)])
    );
  }
  return value;
};

export const useDraftStore = (resource: string, recordId: string) => {
  const storeKey = `draft.${resource}.${recordId}`;
  const [draft, setDraft] = useStore<Record<string, unknown> | undefined>(storeKey, undefined);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (values: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDraft(prepareForDraft(values) as Record<string, unknown>);
      }, DEBOUNCE_MS);
    },
    [setDraft]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDraft(undefined);
  }, [setDraft]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {draft, saveDraft, clearDraft};
};
