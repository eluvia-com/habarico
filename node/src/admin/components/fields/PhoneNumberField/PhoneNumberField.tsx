import {get} from 'lodash-es';
import React from 'react';
import {FunctionField, RaRecord} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useFieldHighlight} from '@admin/hooks/useFieldHighlight';
import {selfHighlightingField} from '@admin/utils/highlight';
import {FlagIcon} from '@design/atoms/FlagIcon';
import {RichText, applyOffsetsToFormatted} from '@design/molecules/RichText';
import {formatPhoneNumber, getCountryFormat} from '@foundation/utils/localflavor/phone';
import {Stack} from '@mui/material';

export const PhoneNumberField = selfHighlightingField(({source, sx = {}}: FieldProps) => {
  const highlight = useFieldHighlight(source);

  const format = (record: RaRecord) => {
    const value = get(record, source);
    if (!value) return '--';
    const strValue = value.toString();
    const countryFormat = getCountryFormat(strValue);
    const formatted = formatPhoneNumber(strValue);

    // When matched, mark just the found part of the number (via the raw-value offsets); the phone
    // digits align 1:1 with the raw value since formatting only inserts separators. Fall back to
    // marking the whole number when offsets are absent or none of the visible digits matched.
    let highlightedNumber: string | null = null;
    if (highlight) {
      const mapped = highlight.offsets?.length
        ? applyOffsetsToFormatted(strValue, formatted, highlight.offsets)
        : null;
      highlightedNumber = mapped?.includes('[highlight]')
        ? mapped
        : `[highlight]${formatted}[/highlight]`;
    }

    return (
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {countryFormat && <FlagIcon code={countryFormat.region} sx={{width: 20, height: 14}} />}
        {/* Mark only the number (never the flag); offsets narrow it to the matched digits. */}
        <span>{highlightedNumber != null ? <RichText text={highlightedNumber} /> : formatted}</span>
      </Stack>
    );
  };

  return (
    <FunctionField
      source={source}
      render={(record: RaRecord) => format(record)}
      sx={{whiteSpace: 'nowrap', ...sx}}
    />
  );
});
