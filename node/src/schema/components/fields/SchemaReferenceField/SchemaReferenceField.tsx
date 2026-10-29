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
  referenceMaxWidth,
} from '@schema/components/fields/referenceVariant';
import {useFieldDefaults} from '@schema/contexts/FieldDefaultsContext';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {FieldOptions, ReferenceVariant} from '@schema/types';
import {FIELD_DEFAULT} from '@schema/utils/fieldSelection';
import {viewModeToPresentation} from '@schema/utils/viewMode';
import {SchemaReferenceFieldContent} from './SchemaReferenceFieldContent';

export type SchemaReferenceFieldProps = FieldProps & {
  reference?: string;
  targetSource?: string;
  options?: FieldOptions;
  // Chip or a plain text link. Defaults to `fieldDefaults.reference` (`'chip'` unless the
  // application says otherwise) — an explicit value here wins over it. Ignored by the
  // `targetSource` branch below, which renders a field of the related record, not a representation.
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
  variant: inVariant,
}: SchemaReferenceFieldProps) => {
  const reference = useResourceContext(inReference);
  const {isInCollection} = useValueLocationContext();
  // Read above the early returns below — the hook has to run on every render of this component.
  const {reference: defaultVariant} = useFieldDefaults();
  const variant = inVariant ?? defaultVariant;

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
