import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, useRecordContext} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {selfHighlightingField} from '@admin/utils/highlight';
import {RichText, applyOffsetsToFormatted} from '@design/molecules/RichText';
import {Typography} from '@mui/material';

export type NumberFieldProps = FieldProps & {
  locales?: string;
  /** Standard `Intl.NumberFormatOptions` — the schema layer maps its `numberFormat` option here. */
  numberFormat?: Intl.NumberFormatOptions;
  prefix?: string;
  postfix?: string;
};

const defaultTransform = (value: unknown) =>
  value && typeof value === 'string' && !isNaN(Number(value)) ? +value : value;

const hasNumberFormat = !!(
  typeof Intl === 'object' &&
  Intl &&
  typeof Intl.NumberFormat === 'function'
);

export const NumberField = selfHighlightingField(
  ({
    numberFormat,
    prefix,
    postfix,
    locales,
    transform = defaultTransform,
    emptyText,
    source,
    ...rest
  }: NumberFieldProps) => {
    const record = useRecordContext(rest);
    const rawValue = get(record, source)?.toString();
    let value: unknown = rawValue;

    const highlight = useFieldHighlight(source);

    // Currency / unit adornment detection uses the same `Intl.NumberFormatOptions` the schema maps.
    const {style, currency, unit} = numberFormat || {};

    if (transform) {
      value = transform(value);
    }

    if (hasNumberFormat && typeof value === 'number') {
      value = value.toLocaleString(locales);
    }

    // When the field matched a search, mark just the found digits inside the formatted value
    // (via the raw-value offsets). Fall back to marking the whole value when offsets are absent or
    // none of the visible digits matched (e.g. the match was in a fraction the FE does not show).
    let highlightedValue: string | null = null;
    if (highlight && rawValue && typeof value === 'string') {
      const mapped = highlight.offsets?.length
        ? applyOffsetsToFormatted(rawValue, value, highlight.offsets)
        : null;
      highlightedValue = mapped?.includes('[highlight]')
        ? mapped
        : `[highlight]${value}[/highlight]`;
    }

    // --------------------------------------------------------------------------
    // Evaluate prefix/postfix values
    // --------------------------------------------------------------------------

    const formatToParts = Intl.NumberFormat(locales, {style, currency, unit}).formatToParts(0);

    const prefixParts = [
      formatToParts[0].type === 'currency' ? formatToParts[0].value : undefined,
      prefix,
    ];
    const postfixParts = [
      ['currency', 'unit'].includes(formatToParts[formatToParts.length - 1].type)
        ? formatToParts[formatToParts.length - 1].value
        : undefined,
      postfix,
    ];

    const prefixValue = prefix || prefixParts.filter((part) => part).join('\u00A0');
    const postfixValue = postfix || postfixParts.filter((part) => part).join('\u00A0');

    // --------------------------------------------------------------------------
    // Render with prefix/postfix
    // --------------------------------------------------------------------------

    const render = () => {
      if (value === undefined || value === null || value === '') {
        return emptyText;
      }

      return (
        <>
          {prefixValue && (
            <>
              <Typography variant="body2" sx={{color: 'text.secondary', display: 'inline'}}>
                {prefixValue}
              </Typography>
              &nbsp;
            </>
          )}
          {highlightedValue != null ? <RichText text={highlightedValue} /> : value}
          {postfixValue && (
            <>
              &nbsp;
              <Typography variant="body2" sx={{color: 'text.secondary', display: 'inline'}}>
                {postfixValue}
              </Typography>
            </>
          )}
        </>
      );
    };
    return <FunctionField source={source} {...rest} render={render} />;
  }
);
