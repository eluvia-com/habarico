import type {SxProps, Theme} from '@mui/material/styles';

export type TextSegmentText = {type: 'text'; value: string};
export type TextSegmentIcon = {type: 'icon'; name: string; color?: string};
export type TextSegmentHighlight = {type: 'highlight'; value: string};
export type TextSegmentBold = {type: 'bold'; value: string};

export type TextSegment =
  TextSegmentText | TextSegmentIcon | TextSegmentHighlight | TextSegmentBold;

// To add a new token:
//   1. Export a new TextSegment variant above.
//   2. Add a RE_* constant below and append it to RICH_TEXT_RE.
//   3. Add the new tag to the HAS_RICH_TEXT_RE
//   3. Add the new capture group names to the destructuring in parseRichText.
//   4. Add a branch to the if/else chain in parseRichText that pushes the new segment.
//   5. Add one case to the switch in RichText.tsx.

// [icon:Name] or [icon:Name:#color] — capture groups: (1) name, (2) color?
const RE_ICON = String.raw`\[icon:([A-Za-z0-9]+)(?::([^\]]{0,20}))?\]`;

// [highlight]...[/highlight] — capture group: (3) content
// Content limited to 10 000 chars to prevent ReDoS on inputs missing the closing tag.
const RE_HIGHLIGHT = String.raw`\[highlight\]([\s\S]{0,10000}?)\[\/highlight\]`;

// [bold]...[/bold] — capture group: (4) content
const RE_BOLD = String.raw`\[bold\]([\s\S]{0,10000}?)\[\/bold\]`;

const RICH_TEXT_RE = new RegExp(`${RE_ICON}|${RE_HIGHLIGHT}|${RE_BOLD}`, 'g');

// Detection regex — cheap check before running the full parser.
const HAS_RICH_TEXT_RE = /\[(?:icon:|(?:highlight|bold)\])/;

const COLOR_RE = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;

function validateColor(raw: string | undefined): string | undefined {
  return raw && COLOR_RE.test(raw) ? raw : undefined;
}

export function parseRichText(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  RICH_TEXT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RICH_TEXT_RE.exec(text)) !== null) {
    const [fullMatch, iconName, iconColor, highlightContent, boldContent] = match;
    const {index} = match;

    if (lastIndex < index) {
      segments.push({type: 'text', value: text.slice(lastIndex, index)});
    }

    if (iconName !== undefined) {
      segments.push({type: 'icon', name: iconName, color: validateColor(iconColor)});
    } else if (highlightContent !== undefined) {
      segments.push({type: 'highlight', value: highlightContent});
    } else if (boldContent !== undefined) {
      segments.push({type: 'bold', value: boldContent});
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    segments.push({type: 'text', value: text.slice(lastIndex)});
  }

  return segments;
}

export function hasRichText(text: string): boolean {
  return HAS_RICH_TEXT_RE.test(text);
}

// Converts backend <mark> highlight tags into the internal [highlight] rich-text markup.
export function markToRichText(text: string): string {
  return text.replace(/<mark>/g, '[highlight]').replace(/<\/mark>/g, '[/highlight]');
}

// Shared background for a search-match highlight, used by both the RichText [highlight] token and
// the whole-value mark (see useFieldHighlight). Semi-transparent so it reads softly and lets
// striped rows show through.
export const HIGHLIGHT_BG = {
  light: 'rgba(255, 235, 59, 0.4)',
  dark: 'rgba(255, 213, 0, 0.24)',
};

// Inline highlight for a whole matched value, matching RichText's [highlight] token colour so the
// different highlight paths look identical. Applied by SchemaFieldContent as an inline mark hugging
// the value (not a full-width cell bar); self-highlighting fields render their own marks.
export const HIGHLIGHT_SX: SxProps<Theme> = (theme) => ({
  // inline-block so the mark shrink-wraps the value even when the field renders a block/full-width
  // element (e.g. right-aligned fields), instead of stretching the highlight across the whole cell.
  display: 'inline-block',
  maxWidth: '100%',
  borderRadius: 0.5,
  color: 'inherit',
  backgroundColor: theme.palette.mode === 'dark' ? HIGHLIGHT_BG.dark : HIGHLIGHT_BG.light,
});

const isDigit = (char: string) => char >= '0' && char <= '9';

// Raw-value indexes that fall inside a match span.
const collectMatchedIndexes = (offsets: [number, number][]): Set<number> => {
  const matched = new Set<number>();
  offsets.forEach(([start, end]) => {
    for (let i = start; i < end; i++) matched.add(i);
  });
  return matched;
};

// Positions of the digit characters within a string, in order.
const digitPositions = (text: string): number[] => {
  const positions: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (isDigit(text[i])) positions.push(i);
  }
  return positions;
};

// Per-character flags marking which formatted characters belong to a match. Formatted digits align
// left-to-right with the raw digits; a separator between two matched digits is bridged so a group
// stays visually contiguous.
const markMatchedChars = (
  formatted: string,
  matched: Set<number>,
  rawDigitIndexes: number[]
): boolean[] => {
  const marked = new Array<boolean>(formatted.length).fill(false);
  digitPositions(formatted).forEach((position, digit) => {
    const rawIndex = rawDigitIndexes[digit];
    marked[position] = rawIndex !== undefined && matched.has(rawIndex);
  });
  for (let i = 1; i < formatted.length - 1; i++) {
    if (!isDigit(formatted[i]) && marked[i - 1] && marked[i + 1]) marked[i] = true;
  }
  return marked;
};

// Wraps contiguous runs of marked characters in [highlight] rich-text tokens.
const wrapMarkedRuns = (formatted: string, marked: boolean[]): string => {
  let out = '';
  let open = false;
  for (let i = 0; i < formatted.length; i++) {
    if (marked[i] && !open) {
      out += '[highlight]';
      open = true;
    } else if (!marked[i] && open) {
      out += '[/highlight]';
      open = false;
    }
    out += formatted[i];
  }
  return open ? `${out}[/highlight]` : out;
};

// Wraps the matched portions of a formatted numeric string in [highlight] rich-text tokens, using
// the match offsets reported against the raw (unformatted) value. Formatting only inserts group
// separators and may drop/pad trailing fraction digits, but the digit sequence stays in order, so
// the formatted digits are aligned left-to-right with the raw digits.
export const applyOffsetsToFormatted = (
  rawValue: string,
  formatted: string,
  offsets: [number, number][]
): string => {
  const matched = collectMatchedIndexes(offsets);
  const rawDigitIndexes = digitPositions(rawValue);
  const marked = markMatchedChars(formatted, matched, rawDigitIndexes);
  return wrapMarkedRuns(formatted, marked);
};
