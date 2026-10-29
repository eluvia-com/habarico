import React from 'react';
import {Labeled, TextField} from 'react-admin';
import {ReferenceField} from '@admin/components/fields/ReferenceField';
import {FieldProps} from '@admin/components/fields/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {
  ValueLocationContextProvider,
  useValueLocationContext,
} from '@design/contexts/ValueLocationContext';
import {SchemaRecordRepresentation} from '@schema/components/fields/SchemaRecordRepresentation';
import {
  REFERENCE_WIDTH_OFFSET,
  ReferenceVariant,
  referenceMaxWidth,
} from '@schema/components/fields/referenceVariant';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {FieldOptions} from '@schema/types';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {viewModeToPresentation} from '@schema/utils/viewMode';
import {SchemaReferenceFieldContent} from './SchemaReferenceFieldContent';

export type SchemaReferenceFieldProps = FieldProps & {
  reference?: string;
  targetSource?: string;
  options?: FieldOptions;
  // Chip (the default) or a plain text link. Ignored by the `targetSource` branch below, which
  // renders a field of the related record rather than its representation.
  variant?: ReferenceVariant;
};

export const SchemaReferenceField = ({
  source,
  label,
  textAlign,
  emptyText,
  reference: inReference,
  targetSource,
  options,
  variant = 'chip',
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

  // Both forms are capped at the same width: the offset compensates the cell's own padding, which
  // a text link pays just as a chip does.
  const maxWidth = isInCollection
    ? referenceMaxWidth(source, REFERENCE_WIDTH_OFFSET.cell)
    : undefined;

  const representationProps = {
    maxWidth,
    link: options?.relation?.showLink ?? true,
    linkMode: viewModeToPresentation(options?.relation?.linkMode),
    dialogWidth: options?.relation?.dialogWidth,
  };

  return (
    <ReferenceField
      reference={reference}
      label={label}
      source={source}
      empty={emptyText}
      queryOptions={{meta: {fields: {id: FIELD_DEFAULT, meta: {repr: FIELD_DEFAULT}}}}}
    >
      <SchemaRecordRepresentation variant={variant} {...representationProps} />
    </ReferenceField>
  );
};
