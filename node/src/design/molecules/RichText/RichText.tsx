import React, {useMemo} from 'react';
import {Box, useTheme} from '@mui/material';
import {Icon} from '../../atoms/Icon';
import {HIGHLIGHT_BG, parseRichText} from './utils';

export type RichTextProps = {
  text: string;
};

/**
 * Renders a lightweight rich-text string into inline React nodes: `[icon:Name(:color)]` glyphs
 * (via the `Icon` atom), `[highlight]…[/highlight]` spans, `[bold]…[/bold]` and plain text.
 * Purely presentational — pass the raw markup string as `text`; unknown or unclosed tags fall
 * back to plain text. See `./utils` for the token grammar.
 */
export const RichText = ({text}: RichTextProps) => {
  const segments = useMemo(() => parseRichText(text), [text]);
  const theme = useTheme();
  const highlightBg = theme.palette.mode === 'dark' ? HIGHLIGHT_BG.dark : HIGHLIGHT_BG.light;

  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'icon':
            return (
              <Icon
                key={i}
                icon={segment.name}
                sx={{
                  verticalAlign: 'middle',
                  fontSize: 'inherit',
                  ...(segment.color ? {color: segment.color} : {}),
                }}
              />
            );
          case 'highlight':
            return (
              <Box key={i} component="span" sx={{backgroundColor: highlightBg}}>
                {segment.value}
              </Box>
            );
          case 'bold':
            return <strong key={i}>{segment.value}</strong>;
          case 'text':
          default:
            return <React.Fragment key={i}>{segment.value}</React.Fragment>;
        }
      })}
    </>
  );
};
