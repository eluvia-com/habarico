import {describe, expect, it} from 'vitest';
import {formatAccept, joinHintParts} from '../utils';

describe('formatAccept', () => {
  it('returns undefined for a missing or empty list', () => {
    expect(formatAccept(undefined)).toBeUndefined();
    expect(formatAccept([])).toBeUndefined();
  });

  it('shows extensions without the leading dot, upper-cased', () => {
    expect(formatAccept(['.pdf', '.png'])).toBe('PDF, PNG');
  });

  it('shows a media type as the extension its subtype names', () => {
    expect(formatAccept(['image/png', 'image/webp', 'application/pdf'])).toBe('PNG, WEBP, PDF');
  });

  it('shows a media type whose subtype is not the known extension by its extension', () => {
    expect(formatAccept(['image/svg+xml', 'text/plain', 'audio/mpeg'])).toBe('SVG, TXT, MP3');
  });

  it('shows Office media types as their extensions', () => {
    expect(
      formatAccept([
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ])
    ).toBe('DOC, DOCX, XLS, XLSX, PPT, PPTX');
  });

  it('leaves out a wildcard, which names no concrete format', () => {
    expect(formatAccept(['image/*', '.pdf'])).toBe('PDF');
  });

  it('leaves out a media type it cannot name', () => {
    expect(formatAccept(['application/vnd.example.report', 'application/x-custom', '.csv'])).toBe(
      'CSV'
    );
    expect(formatAccept(['application/octet-stream'])).toBeUndefined();
  });

  it('returns undefined when no entry names a concrete format', () => {
    expect(formatAccept(['image/*'])).toBeUndefined();
    expect(formatAccept(['image/*', 'video/*'])).toBeUndefined();
  });

  it('shows JPEG under one label, whichever way the entry names it', () => {
    expect(formatAccept(['.jpg'])).toBe('JPG (JPEG)');
    expect(formatAccept(['.jpeg'])).toBe('JPG (JPEG)');
    expect(formatAccept(['image/jpeg'])).toBe('JPG (JPEG)');
  });

  it('shows each format once, keeping the first occurrence order', () => {
    expect(formatAccept(['.png', '.jpg', '.jpeg', 'image/jpeg', 'image/png', '.PNG'])).toBe(
      'PNG, JPG (JPEG)'
    );
  });

  it('ignores surrounding whitespace, letter case and blank entries', () => {
    expect(formatAccept([' Image/PNG ', ' .Pdf', '', '  '])).toBe('PNG, PDF');
  });
});

describe('joinHintParts', () => {
  it('joins the filled parts and skips the empty ones', () => {
    expect(joinHintParts('PNG, JPG', undefined, 'Max 5 MB')).toBe('PNG, JPG · Max 5 MB');
  });

  it('returns undefined when every part is empty', () => {
    expect(joinHintParts(undefined, '')).toBeUndefined();
  });
});
