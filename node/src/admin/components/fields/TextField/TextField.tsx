import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, useRecordContext} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {selfHighlightingField} from '@admin/utils/highlight';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {RichText} from '@design/molecules/RichText';
import {hasRichText, markToRichText} from '@design/molecules/RichText';
import {Box, Typography} from '@mui/material';

export type TextFieldProps = FieldProps & {
  multiline?: boolean;
  prefix?: string;
  postfix?: string;
};

export const TextField = selfHighlightingField(
  ({prefix, postfix, emptyText, source, multiline, ...rest}: TextFieldProps) => {
    const {isInCollection} = useValueLocationContext();
    const record = useRecordContext(rest);
    const value = get(record, source)?.toString();

    const highlight = useFieldHighlight(source);
    const highlightValue = highlight?.value;

    // A block element only ellipsizes to a single line when `white-space: nowrap` is set on
    // itself — inheriting it from the `FunctionField` root isn't reliable enough (the datagrid's
    // own `& td div` rule only reaches a `Box` actually nested in a `<td>`), so both elements set
    // it explicitly from the same condition. `??`, not `||`: an explicit `multiline` (true or
    // false) must always win — only an *unset* `multiline` falls back to the location-based
    // default (pre-wrap outside a collection, nowrap inside one).
    const whiteSpace = (multiline ?? !isInCollection) ? 'pre-wrap' : 'nowrap';

    // --------------------------------------------------------------------------
    // Render with prefix/postfix
    // --------------------------------------------------------------------------

    const render = () => {
      const isEmpty = value === undefined || value === null || value === '';

      let content: React.ReactNode = value;
      if (isEmpty) {
        content = emptyText;
      } else if (highlightValue != null) {
        content = <RichText text={markToRichText(highlightValue)} />;
      } else if (hasRichText(value)) {
        content = <RichText text={value} />;
      }

      return (
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace,
          }}
        >
          {!isEmpty && prefix && (
            <>
              <Typography variant="body2" sx={{color: 'text.secondary', display: 'inline'}}>
                {prefix}
              </Typography>
              &nbsp;
            </>
          )}
          {content}
          {!isEmpty && postfix && (
            <>
              &nbsp;
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  display: 'inline',
                }}
              >
                {postfix}
              </Typography>
            </>
          )}
        </Box>
      );
    };

    // --------------------------------------------------------------------------
    // Render
    // --------------------------------------------------------------------------

    return <FunctionField source={source} sx={{whiteSpace}} {...rest} render={render} />;
  }
);
