import React, {useState} from 'react';
import {
  AutocompleteArrayInput as RaAutocompleteArrayInput,
  AutocompleteArrayInputProps as RaAutocompleteArrayInputProps,
  RaRecord,
  useChoicesContext,
  useGetRecordRepresentation,
  useTranslate,
} from 'react-admin';
import {Chip} from '@mui/material';

// Deliberately extends React Admin's `AutocompleteArrayInputProps` instead of the shared admin
// `InputProps`: this is a choices/reference multi-select driven by `<ReferenceArrayInput>` and needs
// the full RA surface (`choices`, `optionText`, `filterToQuery`, …) that the curated `InputProps`
// intentionally omits. It is wired by `SchemaReferenceArrayInput`, not the flat provider.
export type AutocompleteArrayInputProps = RaAutocompleteArrayInputProps & {
  minChars?: number;
};

export const AutocompleteArrayInput = ({
  minChars = 1,
  optionText,
  size = 'small',
  ...props
}: AutocompleteArrayInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const translate = useTranslate();
  const {total, perPage, resource, isFromReference} = useChoicesContext();
  const getRecordRepresentation = useGetRecordRepresentation(resource);

  const tooMany = (total ?? 0) > perPage;

  const getLabel = (option: RaRecord): string => {
    if (typeof optionText === 'function') return String(optionText(option) ?? '');
    if (typeof optionText === 'string') return String(option[optionText] ?? '');
    if (isFromReference) return String(getRecordRepresentation(option) ?? '');
    return String(option.name ?? '');
  };

  return (
    <RaAutocompleteArrayInput
      size={size}
      optionText={optionText}
      onInputChange={(_, v) => setInputValue(v ?? '')}
      renderTags={(value, getItemProps) =>
        value.map((option, index) => {
          const {key, ...itemProps} = getItemProps({index});
          return (
            <Chip
              key={key}
              variant="soft"
              color="default"
              size={size}
              label={getLabel(option)}
              {...itemProps}
            />
          );
        })
      }
      {...props}
      shouldRenderSuggestions={() => (tooMany ? inputValue.length >= minChars : true)}
      noOptionsText={
        tooMany ? translate('ra.search.write_text') : translate('ra.search.autocomplete_not_found')
      }
    />
  );
};
