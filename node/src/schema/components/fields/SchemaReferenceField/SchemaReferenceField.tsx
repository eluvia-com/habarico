import React from 'react';
import {Labeled, TextField} from 'react-admin';
import {ReferenceField} from '@admin/components/fields/ReferenceField';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {
  ValueLocationContextProvider,
  useValueLocationContext,
} from '@design/contexts/ValueLocationContext';
import {SchemaRecordRepresentationChip} from '@schema/components/fields/SchemaRecordRepresentationChip';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {FieldOptions} from '@schema/types';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {viewModeToPresentation} from '@schema/utils/viewMode';
import {SchemaReferenceFieldContent} from './SchemaReferenceFieldContent';

export type SchemaReferenceFieldProps = FieldProps & {
  reference?: string;
  targetSource?: string;
  options?: FieldOptions;
};

export const SchemaReferenceField = ({
  source,
  label,
  textAlign,
  emptyText,
  reference: inReference,
  targetSource,
  options,
}: SchemaReferenceFieldProps) => {
  const reference = useResourceContext(inReference);
  const {isInCollection} = useValueLocationContext();

  const {schema: relatedSchema} = useGlobalResourceSchemaContext(reference);

  if (!relatedSchema) return <TextField source={source} label={label} />;

  if (targetSource) {
    const fieldEl = (
      <ReferenceField
        reference={reference}
        source={source!}
        empty={emptyText}
        queryOptions={{
          meta: {fields: {[targetSource]: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}},
        }}
      >
        <ValueLocationContextProvider value={{isNested: true}}>
          <SchemaReferenceFieldContent
            source={targetSource}
            reference={reference}
            textAlign={textAlign}
            options={options}
            label={false}
          />
        </ValueLocationContextProvider>
      </ReferenceField>
    );

    // `label === false` means the caller already renders the label itself (e.g. `SchemaPropertyItem`'s
    // `PropertyItem`) — wrapping in `Labeled` here would duplicate it, so render bare like the
    // in-collection case.
    if (isInCollection || label === false) {
      return fieldEl;
    } else {
      return (
        <Labeled label={label} fullWidth>
          {fieldEl}
        </Labeled>
      );
    }
  }

  const columnWidthVarName = source.replace(/\./g, '__');
  const maxChipWidth = isInCollection
    ? `calc(var(--field-${columnWidthVarName}, 500px) - 32px)`
    : undefined;

  return (
    <ReferenceField
      reference={reference}
      label={label}
      source={source}
      empty={emptyText}
      queryOptions={{meta: {fields: {id: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}}}}
    >
      <SchemaRecordRepresentationChip
        maxWidth={maxChipWidth}
        link={options?.relation?.showLink ?? true}
        linkMode={viewModeToPresentation(options?.relation?.linkMode)}
        dialogWidth={options?.relation?.dialogWidth}
      />
    </ReferenceField>
  );
};
