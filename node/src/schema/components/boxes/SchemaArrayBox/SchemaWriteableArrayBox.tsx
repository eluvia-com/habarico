import React, {useEffect, useMemo} from 'react';
import {useSourceContext} from 'react-admin';
import {FormArrayInput} from '@admin/components/inputs/FormArrayInput';
import {useFormInputSourcesRegistration} from '@admin/contexts/FormInputSourcesContext/useFormInputSourcesContext';
import {useSettingsContext} from '@design/layouts/contexts/SettingsContext';
import {Box} from '@mui/material';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaInput} from '@schema/components/inputs/SchemaInput';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {FieldSchema} from '@schema/types';
import {buildBoxDefaultValues, collectFieldDescriptors} from '@schema/utils/api';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';

type SchemaWriteableArrayBoxProps = SchemaBoxProps & {
  targetFieldSchema: FieldSchema;
};

export const SchemaWriteableArrayBox = ({schema}: SchemaWriteableArrayBoxProps) => {
  const arrayProperties = schema.array!;

  const fieldSchemas = useFieldSchemaMapContext();
  // Memoized: `generateFieldSchemaMap` walks the box tree and lodash-merges options per field, and
  // — worse than its own cost — a fresh map means fresh `FieldSchema` objects feeding the
  // `SchemaInput` children below, whose fresh identity defeats `FormArrayInput`'s `columns` memo
  // and with it `FormTableRow`'s `React.memo` for every cell of the table.
  const fieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(Object.values(fieldSchemas), collectFieldDescriptors(schema)),
    [fieldSchemas, schema]
  );

  const displayInline = arrayProperties.inline || false;

  const {density} = useSettingsContext();

  const parentSourceContext = useSourceContext();
  const arrayTarget = schema.array?.target ?? '';
  const finalArraySource = parentSourceContext.getSource(arrayTarget);

  const {register, unregister} = useFormInputSourcesRegistration();
  useEffect(() => {
    if (!finalArraySource || !register || !unregister) return;
    register(finalArraySource);
    return () => unregister(finalArraySource);
  }, [finalArraySource, register, unregister]);

  const initialItemValue = useMemo(
    () => buildBoxDefaultValues(schema, Object.values(fieldSchemas), null),
    [schema, fieldSchemas]
  );

  // Memoized alongside `fieldSchemaMap` above: these elements are `FormArrayInput`'s `children`,
  // which its column-building memo keys on — fresh JSX here would re-derive the columns (and
  // re-render every table row) on every render of this box even with the map itself stable.
  const inputs = useMemo(
    () =>
      Object.values(fieldSchemaMap).map((field) => (
        <SchemaInput
          label={field.label}
          schema={field}
          key={field.name}
          source={field.name}
          hiddenEl={<Box />}
        />
      )),
    [fieldSchemaMap]
  );

  if (!schema.array || !schema.array.target) {
    return null;
  }

  // Both variants render the same `SchemaInput`s through `FormArrayInput`; `inline` only switches
  // the cell layout (side by side vs. stacked property rows). No wrapper padding here — the box's
  // `PanelContent` owns the gutter (`paddingSize=medium` in edit).
  return (
    <FormArrayInput
      source={arrayTarget}
      defaultValue={initialItemValue}
      inline={displayInline}
      density={density}
    >
      {inputs}
    </FormArrayInput>
  );
};
