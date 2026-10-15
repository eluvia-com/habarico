export const parseTabsFromHash = (hash: string) => {
  if (!hash) return [];
  let h = hash.trim();
  if (h.startsWith('#')) h = h.slice(1);

  // Support more hash params: "#tabs=...&foo=1"
  const params = new URLSearchParams(h);
  let payload = params.get('tabs');

  // Fallback
  if (!payload && h.startsWith('tabs=')) payload = h.slice(5);
  if (!payload) return [];

  return payload
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const stringifyTabsToHash = (tabs: string[]) => {
  if (tabs.length === 0) return '';
  const payload = tabs.map((v) => encodeURIComponent(v)).join(',');
  return `#tabs=${payload}`;
};
