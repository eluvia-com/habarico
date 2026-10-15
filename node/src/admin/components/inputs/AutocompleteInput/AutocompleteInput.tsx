import React, {useState} from 'react';
import {
  AutocompleteInput as RaAutocompleteInput,
  AutocompleteInputProps as RaAutocompleteInputProps,
  useChoicesContext,
  useTranslate,
} from 'react-admin';

// Deliberately extends React Admin's `AutocompleteInputProps` instead of the shared admin
// `InputProps`: this is a choices/reference input driven by `<ReferenceInput>` and needs the full RA
// surface (`choices`, `optionText`, `filterToQuery`, `create`, …) that the curated `InputProps`
// intentionally omits. It is wired by `SchemaReferenceInput`, not the flat input provider.
export type AutocompleteInputProps = RaAutocompleteInputProps & {
  minChars?: number;
};

export const AutocompleteInput = ({minChars = 1, ...props}: AutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const translate = useTranslate();
  const {total, perPage} = useChoicesContext();

  const tooMany = (total ?? 0) > perPage;

  return (
    <RaAutocompleteInput
      onInputChange={(_, v) => setInputValue(v ?? '')}
      {...props}
      shouldRenderSuggestions={() => (tooMany ? inputValue.length >= minChars : true)}
      noOptionsText={
        tooMany ? translate('ra.search.write_text') : translate('ra.search.autocomplete_not_found')
      }
    />
  );
};
