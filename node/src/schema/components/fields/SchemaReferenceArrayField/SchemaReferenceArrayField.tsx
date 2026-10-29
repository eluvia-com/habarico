import {get} from 'lodash-es';
import {RaRecord} from 'ra-core';
import React from 'react';
import {FunctionField, SingleFieldList, TextField} from 'react-admin';
import {ReferenceArrayField} from '@admin/components/fields/ReferenceArrayField';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {SchemaRecordRepresentation} from '@schema/components/fields/SchemaRecordRepresentation';
import {
  REFERENCE_WIDTH_OFFSET,
  referenceMaxWidth,
} from '@schema/components/fields/referenceVariant';
import {useFieldDefaults} from '@schema/contexts/FieldDefaultsContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {FieldSchema, ItemFieldSchema, ReferenceVariant} from '@schema/types';
import {convertApiSortToRaSort} from '@schema/utils/api';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {viewModeToPresentation} from '@schema/utils/viewMode';
import {SchemaTreeReferenceArrayField} from './SchemaTreeReferenceArrayField';

export type SchemaReferenceArrayFieldProps = FieldProps & {
  items: ItemFieldSchema | FieldSchema;
  // Chip or a plain text link; defaults to `fieldDefaults.reference` and an explicit value wins
  // over it. `'link'` also stacks the references one per line — see the `SingleFieldList` below.
  // Not read by the tree branch, which renders a tree rather than a list of representations.
  variant?: ReferenceVariant;
};

export const SchemaReferenceArrayField = ({
  source,
  label,
  emptyText,
  items,
  variant: inVariant,
}: SchemaReferenceArrayFieldProps) => {
  const {isInCollection} = useValueLocationContext();
  const reference = useResourceContext(items.reference);
  // Read above the early returns below — the hook has to run on every render of this component.
  const {reference: defaultVariant} = useFieldDefaults();
  const variant = inVariant ?? defaultVariant;

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
    const isLink = variant === 'link';
    // A stacked text link only pays the cell's own padding: it has neither the chip's inset nor the
    // row gap, so the chip's larger offset would ellipsise it well before the column runs out.
    const widthOffset = isLink ? REFERENCE_WIDTH_OFFSET.cell : REFERENCE_WIDTH_OFFSET.chipRow;
    const maxWidth = isInCollection ? referenceMaxWidth(source, widthOffset) : undefined;

    const representationProps = {
      maxWidth,
      link: items.options?.relation?.showLink ?? true,
      linkMode: viewModeToPresentation(items.options?.relation?.linkMode),
      dialogWidth: items.options?.relation?.dialogWidth,
    };

    return (
      <ReferenceArrayField
        reference={reference}
        label={label}
        source={source}
        sort={sort}
        preserveOrder={preserveOrder}
        queryOptions={{meta: {fields: {id: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}}}}
      >
        <SingleFieldList
          linkType={false}
          // One link per line: a row of text links reads as a single run-on sentence, where chips
          // carry a shape that keeps neighbors apart. `alignItems` keeps each link's click target
          // to its own text instead of stretching it across the container.
          //
          // The axis is the list's own, so it is set here rather than reached through
          // `ReferenceArrayField`. It applies in a collection cell too: the datagrid row has no
          // fixed height, so it simply grows.
          direction={isLink ? 'column' : 'row'}
          sx={isLink ? {alignItems: 'flex-start'} : undefined}
        >
          <SchemaRecordRepresentation variant={variant} {...representationProps} />
        </SingleFieldList>
      </ReferenceArrayField>
    );
  };

  return <FunctionField source={source} render={(record: RaRecord) => format(record)} />;
};
