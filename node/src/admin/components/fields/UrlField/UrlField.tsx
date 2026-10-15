import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, RaRecord} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {selfHighlightingField} from '@admin/utils/highlight';
import {RichText} from '@design/molecules/RichText';
import {markToRichText} from '@design/molecules/RichText';
import {isSafeUrl} from '@foundation/utils/navigation';
import {Box, Link} from '@mui/material';

export const UrlField = selfHighlightingField(
  ({source, emptyText = '--', sx, ...rest}: FieldProps) => {
    const highlight = useFieldHighlight(source);

    const render = (record: RaRecord) => {
      const value = get(record, source)?.toString();
      if (!value) return emptyText;

      // A matched URL marks only the found substring inline, not the whole cell.
      const content =
        highlight?.value != null ? <RichText text={markToRichText(highlight.value)} /> : value;

      // The value is whatever the record holds, which is not necessarily a URL we want to send the
      // admin to. Anything but http/https stays visible but is not turned into a link — React
      // blocks a `javascript:` href on its own, but not `data:` or `blob:`.
      if (!isSafeUrl(value))
        return (
          <Box component={'span'} sx={sx}>
            {content}
          </Box>
        );

      return (
        <Link
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          sx={sx}
        >
          {content}
        </Link>
      );
    };

    return <FunctionField source={source} {...rest} render={render} />;
  }
);
