// Platform-aware label for the global search keyboard shortcut. macOS shows the
// Command glyph (`⌘K`); every other platform shows `Ctrl+K`. The actual keydown
// matcher in the layout accepts either modifier, so this only drives the label.
export const getSearchShortcutLabel = (): string => {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  const platform = navigator.platform || navigator.userAgent || '';
  const isMac = /mac|iphone|ipad|ipod/i.test(platform);
  return isMac ? '⌘K' : 'Ctrl+K';
};
