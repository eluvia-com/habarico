import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, RaRecord} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {selfHighlightingField} from '@admin/utils/highlight';
import {RichText} from '@design/molecules/RichText';
import {markToRichText} from '@design/molecules/RichText';
import {Link} from '@mui/material';

export const EmailField = selfHighlightingField(
  ({source, emptyText = '--', sx, ...rest}: FieldProps) => {
    const highlight = useFieldHighlight(source);

    const render = (record: RaRecord) => {
      const value = get(record, source)?.toString();
      if (!value) return emptyText;

      return (
        <Link href={`mailto:${value}`} onClick={(event) => event.stopPropagation()} sx={sx}>
          {/* A matched email marks only the found substring inline, not the whole cell. */}
          {highlight?.value != null ? <RichText text={markToRichText(highlight.value)} /> : value}
        </Link>
      );
    };

    return <FunctionField source={source} {...rest} render={render} />;
  }
);
