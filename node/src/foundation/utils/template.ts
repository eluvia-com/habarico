import {get, trim, truncate, upperFirst} from 'lodash-es';

export const REGEX = /%\{([\w.]+)\}/g;

export const templateToStr = <T extends string | undefined>(
  text: T,
  data?: Record<string, unknown>,
  options?: {upperFirst?: boolean; truncate?: boolean; trim?: boolean}
): T => {
  if (text === undefined) return text;

  const {
    truncate: shouldTruncate = false,
    upperFirst: shouldUpperFirst = true,
    trim: shouldTrim = true,
  } = options || {};

  const trimmedText = shouldTrim ? trim(text) : text;
  const truncatedText = shouldTruncate ? truncate(trimmedText) : trimmedText;
  const upperText = shouldUpperFirst ? upperFirst(truncatedText) : truncatedText;

  return upperText.replace(REGEX, (match, path) => {
    const val = get(data || {}, path);
    return val ? String(val) : '';
  }) as T;
};
