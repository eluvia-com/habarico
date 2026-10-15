import {describe, expect, it} from 'vitest';
import {hasRichText, parseRichText} from '../utils';

describe('parseRichText', () => {
  it('returns single text segment for plain text', () => {
    expect(parseRichText('hello world')).toEqual([{type: 'text', value: 'hello world'}]);
  });

  it('returns empty array for empty string', () => {
    expect(parseRichText('')).toEqual([]);
  });

  it('parses icon without color', () => {
    expect(parseRichText('[icon:Home]')).toEqual([{type: 'icon', name: 'Home', color: undefined}]);
  });

  it('parses icon with valid 6-digit hex color', () => {
    expect(parseRichText('[icon:Star:#ff0000]')).toEqual([
      {type: 'icon', name: 'Star', color: '#ff0000'},
    ]);
  });

  it('parses icon with valid 3-digit hex color', () => {
    expect(parseRichText('[icon:Star:#f0f]')).toEqual([
      {type: 'icon', name: 'Star', color: '#f0f'},
    ]);
  });

  it('rejects invalid color (named) and returns undefined', () => {
    expect(parseRichText('[icon:Star:red]')).toEqual([
      {type: 'icon', name: 'Star', color: undefined},
    ]);
  });

  it('rejects CSS injection attempt in color', () => {
    expect(parseRichText('[icon:Home:red; background: url(evil)]')).toEqual([
      {type: 'text', value: '[icon:Home:red; background: url(evil)]'},
    ]);
  });

  it('parses highlight', () => {
    expect(parseRichText('[highlight]text[/highlight]')).toEqual([
      {type: 'highlight', value: 'text'},
    ]);
  });

  it('does not parse highlight with color — treats it as plain text', () => {
    expect(parseRichText('[highlight:#aabbcc]text[/highlight]')).toEqual([
      {type: 'text', value: '[highlight:#aabbcc]text[/highlight]'},
    ]);
  });

  it('parses bold', () => {
    expect(parseRichText('[bold]strong text[/bold]')).toEqual([
      {type: 'bold', value: 'strong text'},
    ]);
  });

  it('handles text before and after a tag', () => {
    expect(parseRichText('before [bold]middle[/bold] after')).toEqual([
      {type: 'text', value: 'before '},
      {type: 'bold', value: 'middle'},
      {type: 'text', value: ' after'},
    ]);
  });

  it('handles multiple tags in sequence', () => {
    expect(parseRichText('[icon:Star] [bold]title[/bold]')).toEqual([
      {type: 'icon', name: 'Star', color: undefined},
      {type: 'text', value: ' '},
      {type: 'bold', value: 'title'},
    ]);
  });

  it('ignores unknown block tags and returns them as plain text', () => {
    expect(parseRichText('[unknown]text[/unknown]')).toEqual([
      {type: 'text', value: '[unknown]text[/unknown]'},
    ]);
  });

  it('returns raw text when closing tag is missing', () => {
    expect(parseRichText('[highlight]text without closing')).toEqual([
      {type: 'text', value: '[highlight]text without closing'},
    ]);
  });

  it('handles combination of all token types', () => {
    const result = parseRichText(
      '[icon:Check:#00aa00] [highlight]ok[/highlight] — [bold]done[/bold]'
    );
    expect(result).toEqual([
      {type: 'icon', name: 'Check', color: '#00aa00'},
      {type: 'text', value: ' '},
      {type: 'highlight', value: 'ok'},
      {type: 'text', value: ' — '},
      {type: 'bold', value: 'done'},
    ]);
  });

  it('is idempotent — same result on repeated calls', () => {
    const text = '[icon:Home] [bold]test[/bold]';
    expect(parseRichText(text)).toEqual(parseRichText(text));
  });
});

describe('hasRichText', () => {
  it('returns false for plain text', () => {
    expect(hasRichText('hello world')).toBe(false);
  });

  it('returns true for icon token', () => {
    expect(hasRichText('[icon:Home]')).toBe(true);
  });

  it('returns true for highlight token', () => {
    expect(hasRichText('[highlight]foo[/highlight]')).toBe(true);
  });

  it('returns true for bold token', () => {
    expect(hasRichText('[bold]foo[/bold]')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(hasRichText('')).toBe(false);
  });
});
