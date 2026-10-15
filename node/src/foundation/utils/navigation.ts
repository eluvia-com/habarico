export type NavMode = 'same' | 'tab' | 'window';

// Where a link opens: the current tab (`self`) or a new one (`blank`). A generic, non-visual
// navigation vocabulary term — consumed by the admin link buttons and by the schema menu/action
// descriptors that drive them.
export type LinkTarget = 'self' | 'blank';

const SAFE_PROTOCOLS = ['http:', 'https:'];

// A URL that reaches the link components is attacker-controllable: the schema templates record
// values into it (`%{data.website}`), so a value saved by any user with write access to that field
// ends up as the navigation target. Anything but `http:`/`https:`/relative is refused — a
// `javascript:` URL would otherwise run in the admin's session, and `data:`/`blob:` would render
// attacker HTML on our origin.
//
// Resolution goes through the platform parser rather than a regex allowlist: a relative path
// carries no scheme of its own and inherits the page's, while a value that does carry one keeps it
// regardless of the base. The parser also drops the tab and newline characters that `java\tscript:`
// hides behind, which is precisely where a regex lets one through.
export const isSafeUrl = (url: string): boolean => {
  if (!url.trim()) return false;

  try {
    return SAFE_PROTOCOLS.includes(new URL(url, window.location.href).protocol);
  } catch {
    return false;
  }
};

// The one place in the library that opens a schema-supplied URL. `noopener,noreferrer` is passed
// for both targets: `_self` is exempt from the rule that noopener forces a new browsing context
// (unlike a custom window name), so the current tab still navigates in place — the only effect
// there is a suppressed `Referer`. Returns false when the URL was refused.
export const openUrl = (url: string, target: LinkTarget = 'blank'): boolean => {
  if (!isSafeUrl(url)) {
    console.warn(`[habarico] Refused to open an unsafe URL: ${url}`);
    return false;
  }

  // The target is typed, but it arrives at runtime from the backend schema — normalizing here
  // keeps an unexpected value from becoming an arbitrary window name.
  window.open(url, target === 'self' ? '_self' : '_blank', 'noopener,noreferrer');
  return true;
};

export const getNavigationMode = (
  e: Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>
): NavMode => {
  if (e.shiftKey) return 'window';
  if (e.ctrlKey || e.metaKey) return 'tab';
  return 'same';
};

export const openByMode = (url: string, mode: NavMode) => {
  if (mode === 'same') return false;

  // Reported as handled so the caller does not fall through to its own, unguarded navigation.
  if (!isSafeUrl(url)) {
    console.warn(`[habarico] Refused to open an unsafe URL: ${url}`);
    return true;
  }

  const features = mode === 'window' ? 'noopener,noreferrer,popup' : 'noopener,noreferrer';
  window.open(url, '_blank', features);
  return true;
};
