import React, {useState} from 'react';
import {ReferenceArrayInput, TextInput, useLocaleState} from 'react-admin';
import {AutocompleteArrayInput} from '@admin/components/inputs/AutocompleteArrayInput';
import {InputProps} from '@admin/components/inputs/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {Box, Stack} from '@mui/material';
import {SchemaCreateButton} from '@schema/components/buttons/SchemaCreateButton';
import {FieldSchema, ItemFieldSchema} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {SchemaTreeReferenceArrayInput} from './SchemaTreeReferenceArrayInput';

export type SchemaReferenceArrayInputProps = InputProps & {
  defaultValue?: unknown;
  items: ItemFieldSchema | FieldSchema;
};

export const SchemaReferenceArrayInput = ({
  source,
  label,
  validate,
  defaultValue,
  items,
  ...rest
}: SchemaReferenceArrayInputProps) => {
  const [focused, setFocused] = useState(false);
  const reference = useResourceContext(items.reference);
  const [locale] = useLocaleState();

  if (!items.reference) {
    return (
      <TextInput
        source={source}
        label={label}
        defaultValue={defaultValue}
        validate={validate}
        parse={(v: string) => v.split(',')}
        size="small"
        fullWidth
      />
    );
  }

  const createButton = items.options?.relation?.showCreateButton ? (
    <Box sx={{pb: 3}}>
      <SchemaCreateButton resource={reference} showLabel={false} size="small" mode="dialog" />
    </Box>
  ) : null;

  // Tree branch: resolved *outside* `ReferenceArrayInput`. `TreeArrayInput` takes its `choices` from
  // `useTreeChoices` (via the wrapper), so it needs no React Admin choices/reference context.
  if (items.format === 'tree-relation') {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems={'center'}
        width={rest.fullWidth ? '100%' : undefined}
      >
        <SchemaTreeReferenceArrayInput
          source={source}
          label={label}
          validate={validate}
          defaultValue={defaultValue}
          items={items}
          {...rest}
        />
        {createButton}
      </Stack>
    );
  }

  const filters: {[key: string]: unknown} = {};
  if (items.options?.relation?.filters) {
    for (const filter of items.options.relation.filters) {
      filters[filter.name] = filter.value;
    }
  }

  const sort = convertApiSortToRaSort(items.options?.relation?.sort);

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems={'center'}
      width={rest.fullWidth ? '100%' : undefined}
    >
      <ReferenceArrayInput
        reference={reference}
        source={source}
        defaultValue={defaultValue}
        sort={sort}
        filter={filters}
        queryOptions={{meta: {locale, fields: {id: FIELD_DEFAULT}}}}
        enableGetChoices={() => focused}
      >
        <AutocompleteArrayInput
          label={label}
          filterToQuery={(searchText) => ({search_query: searchText || ''})}
          validate={validate}
          openOnFocus={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </ReferenceArrayInput>
      {createButton}
    </Stack>
  );
};
