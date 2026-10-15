import React, {useState} from 'react';
import {ReferenceInput, TextInput, useLocaleState, useTranslate} from 'react-admin';
import {useWatch} from 'react-hook-form';
import {AutocompleteInput} from '@admin/components/inputs/AutocompleteInput';
import {InputProps} from '@admin/components/inputs/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {Box, Stack} from '@mui/material';
import {SchemaCreateButton} from '@schema/components/buttons/SchemaCreateButton';
import {SchemaEditButton} from '@schema/components/buttons/SchemaEditButton';
import {FieldOptions} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';

export type SchemaReferenceInputProps = InputProps & {
  defaultValue?: unknown;
  reference?: string;
  options?: FieldOptions;
};

export const SchemaReferenceInput = ({
  source,
  label,
  validate,
  defaultValue,
  options,
  reference: inReference,
  ...rest
}: SchemaReferenceInputProps) => {
  const [focused, setFocused] = useState(false);

  const filters: {[key: string]: unknown} = {};
  if (options?.relation?.filters) {
    for (const filter of options.relation.filters) {
      filters[filter.name] = filter.value;
    }
  }

  const sort = convertApiSortToRaSort(options?.relation?.sort);

  const value = useWatch({name: source});
  const translate = useTranslate();

  const reference = useResourceContext(inReference);
  const [locale] = useLocaleState();

  if (!reference) {
    return (
      <TextInput
        source={source}
        label={label}
        defaultValue={defaultValue}
        validate={validate}
        size="small"
      />
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems={'center'}
      width={rest.fullWidth ? '100%' : undefined}
    >
      <ReferenceInput
        reference={reference}
        source={source}
        defaultValue={defaultValue}
        filter={filters}
        sort={sort}
        queryOptions={{
          meta: {locale, fields: {id: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}},
        }}
        enableGetChoices={() => {
          return focused;
        }}
      >
        <AutocompleteInput
          label={label}
          filterToQuery={(searchText) => ({search_query: searchText || ''})}
          defaultValue={defaultValue}
          validate={validate}
          noOptionsText={translate('ra.search.autocomplete_not_found')}
          openOnFocus={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </ReferenceInput>
      {options?.relation?.showCreateButton && (
        <Box
          sx={{
            pb: 3,
          }}
        >
          <SchemaCreateButton resource={reference} showLabel={false} size="small" mode="dialog" />
        </Box>
      )}
      {options?.relation?.showEditButton && value && (
        <Box
          sx={{
            pb: 3,
          }}
        >
          <SchemaEditButton
            resource={reference}
            recordPk={value}
            showLabel={false}
            size="small"
            mode={'dialog'}
          />
        </Box>
      )}
    </Stack>
  );
};
