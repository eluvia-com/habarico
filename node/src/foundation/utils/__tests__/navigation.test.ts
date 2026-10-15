import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {isSafeUrl, openByMode, openUrl} from '@foundation/utils/navigation';

describe('isSafeUrl', () => {
  it.each([
    'https://example.com',
    // Plain http stays allowed on purpose — an intranet admin and local development both use it.
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- that is the case being asserted
    'http://intra.local/x',
    '/shop/orders/42',
    'orders/42?tab=2#note',
    '?tab=2',
    '#section',
    // Protocol-relative: reads as relative but resolves to https. Allowed on purpose — an
    // external https link is allowed anyway; it is simply not same-origin.
    '//cdn.example.com/a',
    // `useStrTemplate` runs the URL through `upperFirst`, so this is what a templated
    // `https://…` actually looks like by the time it reaches the check.
    'Https://example.com',
  ])('accepts %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    // The URL parser strips embedded tabs and newlines, so the scheme is still recognised —
    // this is the case a regex allowlist misses.
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'blob:https://example.com/6e0bf9d0',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'mailto:a@b.cz',
    'tel:+420123456789',
  ])('rejects %s', (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });

  it('rejects an empty or blank URL instead of resolving it to the current page', () => {
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl('   ')).toBe(false);
  });
});

describe('openUrl', () => {
  let open: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, 'open').mockReturnValue(null);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a safe URL in a new tab with noopener and noreferrer by default', () => {
    expect(openUrl('https://example.com')).toBe(true);
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('opens in the current tab for the self target, still without an opener', () => {
    expect(openUrl('/shop/orders/42', 'self')).toBe(true);
    expect(open).toHaveBeenCalledWith('/shop/orders/42', '_self', 'noopener,noreferrer');
  });

  it('falls back to a new tab for a target the backend schema made up', () => {
    openUrl('https://example.com', 'top' as 'blank');
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('does not navigate to an unsafe URL and warns instead', () => {
    expect(openUrl('javascript:alert(1)')).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });
});

describe('openByMode', () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('leaves the same-tab mode to the caller', () => {
    expect(openByMode('/shop/orders/42', 'same')).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it('opens a new tab', () => {
    expect(openByMode('/shop/orders/42', 'tab')).toBe(true);
    expect(open).toHaveBeenCalledWith('/shop/orders/42', '_blank', 'noopener,noreferrer');
  });

  it('opens a popup window', () => {
    expect(openByMode('/shop/orders/42', 'window')).toBe(true);
    expect(open).toHaveBeenCalledWith('/shop/orders/42', '_blank', 'noopener,noreferrer,popup');
  });

  it('reports an unsafe URL as handled so the caller does not fall back to its own navigation', () => {
    expect(openByMode('javascript:alert(1)', 'tab')).toBe(true);
    expect(open).not.toHaveBeenCalled();
  });
});
