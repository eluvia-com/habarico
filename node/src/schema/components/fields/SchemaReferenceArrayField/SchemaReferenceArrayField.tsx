import {get} from 'lodash-es';
import {RaRecord} from 'ra-core';
import React from 'react';
import {FunctionField, SingleFieldList, TextField} from 'react-admin';
import {ReferenceArrayField} from '@admin/components/fields/ReferenceArrayField';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {SchemaRecordRepresentationChip} from '@schema/components/fields/SchemaRecordRepresentationChip';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {FieldSchema, ItemFieldSchema} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {viewModeToPresentation} from '@schema/utils/viewMode';
import {SchemaTreeReferenceArrayField} from './SchemaTreeReferenceArrayField';

export type SchemaReferenceArrayFieldProps = FieldProps & {
  items: ItemFieldSchema | FieldSchema;
};

export const SchemaReferenceArrayField = ({
  source,
  label,
  emptyText,
  items,
}: SchemaReferenceArrayFieldProps) => {
  const {isInCollection} = useValueLocationContext();
  const reference = useResourceContext(items.reference);

  const {schema: relatedSchema} = useGlobalResourceSchemaContext(reference);

  if (!reference || !relatedSchema) {
    return <TextField source={source} label={label} emptyText={emptyText} />;
  }

  // Tree branch (detail view only): resolved *outside* `ReferenceArrayField`. The tree field reads its
  // selected ids from the ambient record and takes `choices` from `useTreeChoices`, so it needs no list
  // context. Inside a collection (`isInCollection`) tree relations still fall back to the chip list.
  if (items?.format === 'tree-relation' && !isInCollection) {
    return <SchemaTreeReferenceArrayField source={source} label={label} items={items} />;
  }

  const sort = convertApiSortToRaSort(items.options?.relation?.sort);
  const preserveOrder = items.options?.relation?.preserveOrder ?? !items.options?.relation?.sort;

  const format = (record: RaRecord) => {
    const value = get(record, source);

    if (!value || value.length === 0) {
      return emptyText;
    }
    const columnWidthVarName = source.replace(/\./g, '__');
    const maxChipWidth = isInCollection
      ? `calc(var(--field-${columnWidthVarName}, 500px) - 46px)`
      : undefined;

    return (
      <ReferenceArrayField
        reference={reference}
        label={label}
        source={source}
        sort={sort}
        preserveOrder={preserveOrder}
        queryOptions={{meta: {fields: {id: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}}}}
      >
        <SingleFieldList linkType={false}>
          <SchemaRecordRepresentationChip
            maxWidth={maxChipWidth}
            link={items.options?.relation?.showLink ?? true}
            linkMode={viewModeToPresentation(items.options?.relation?.linkMode)}
            dialogWidth={items.options?.relation?.dialogWidth}
          />
        </SingleFieldList>
      </ReferenceArrayField>
    );
  };

  return <FunctionField source={source} render={(record: RaRecord) => format(record)} />;
};
