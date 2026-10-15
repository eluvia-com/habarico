import React, {useMemo} from 'react';
import {useSettingsContext} from '@design/layouts/contexts/SettingsContext';
import {PropertyList} from '@design/molecules/PropertyList';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FieldDescriptor} from '@schema/types';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';
import {SchemaPropertyItem} from './SchemaPropertyItem';

type SchemaFieldGroupProps = {
  fields: FieldDescriptor[];
  /** Number of value columns (defaults to 1; multi-column is a future schema-driven enhancement). */
  columns?: number;
};

/**
 * Renders a run of field descriptors as one `PropertyList` of `PropertyItem`s — the box owns each
 * label and every field renders bare in its value slot. The list gives its horizontal rows a
 * minimum height so they share one rhythm whatever the fields render: `lineHeight="smallInput"` in
 * edit mode, `lineHeight="smallField"` in read mode. A taller value — a textarea, rich text, an
 * image — still grows past it.
 */
const SchemaFieldGroupComponent = ({fields, columns = 1}: SchemaFieldGroupProps) => {
  const parentFieldSchemaMap = useFieldSchemaMapContext();
  const {readOnly} = useViewSchemaContext();
  const {density} = useSettingsContext();

  // Build the run's field-schema map from the parent map. Wrapper fields contribute their inner
  // fields (they carry no schema of their own); action fields contribute nothing.
  const fieldDescriptors = useMemo(
    () => fields.flatMap((field) => (field.action ? [] : (field.wrapper?.fields ?? [field]))),
    [fields]
  );
  const fieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(Object.values(parentFieldSchemaMap), fieldDescriptors),
    [parentFieldSchemaMap, fieldDescriptors]
  );

  return (
    <FieldSchemaMapProvider schemaMap={fieldSchemaMap}>
      <PropertyList
        columns={columns}
        density={density}
        lineHeight={readOnly ? 'smallField' : 'smallInput'}
      >
        {fields.map((field, index) => (
          <SchemaPropertyItem key={index} field={field} />
        ))}
      </PropertyList>
    </FieldSchemaMapProvider>
  );
};

// Memoized: called both directly by `SchemaGridBox` (per 'fields' cell) and by `SchemaBoxChildren`
// — same reasoning as there, `fields`/`columns` don't change just because an ancestor re-rendered.
export const SchemaFieldGroup = React.memo(SchemaFieldGroupComponent);
