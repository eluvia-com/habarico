import React, {ReactElement, useMemo} from 'react';
import {Labeled, useRecordContext} from 'react-admin';
import {get, useFormState, useWatch} from 'react-hook-form';
import {DynamicText} from '@admin/components/common/DynamicText';
import {
  ValueLocationContextProvider,
  useValueLocationContext,
} from '@design/contexts/ValueLocationContext';
import {varAlpha} from '@design/theme';
import {templateToStr} from '@foundation/utils/template';
import {Box, FormHelperText, Stack, Theme} from '@mui/material';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FieldDescriptor} from '@schema/types';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';
import {SchemaFieldOrInput} from '../SchemaFieldOrInput';
import {schemaWrappedFieldSx} from './schemaWrappedFieldSx';

export type SchemaWrappedFieldsProps = {
  fields: FieldDescriptor[];
  divider?: React.ReactNode;
  label?: string | false;
  helperText?: string | ReactElement | false;
};

type SchemaWrappedFieldsWritableProps = {
  fields: FieldDescriptor[];
  divider?: React.ReactNode;
  label?: string | false;
  helperText?: string | ReactElement | false;
};

export const SchemaWrappedFields = ({
  fields,
  divider,
  label,
  helperText,
}: SchemaWrappedFieldsProps) => {
  const fieldSchemaMap = useFieldSchemaMapContext();
  const fieldSchemaValues = useMemo(() => Object.values(fieldSchemaMap ?? {}), [fieldSchemaMap]);
  const boxFieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(fieldSchemaValues, fields),
    [fieldSchemaValues, fields]
  );
  const {readOnly} = useViewSchemaContext();
  const {isInCollection} = useValueLocationContext();

  if (fields.length === 0) return;

  const dividerEl = divider ? (
    <Box display="flex" alignItems="center">
      {divider}
    </Box>
  ) : null;

  // List mode: render inline — the column header already carries the wrapper label
  if (isInCollection) {
    return (
      <FieldSchemaMapProvider schemaMap={boxFieldSchemaMap}>
        <Stack direction="row" spacing={1} divider={dividerEl} alignItems="center">
          {fields.map((field) => (
            <SchemaWrappedFieldItem field={field} key={field.name} showLabel={false} />
          ))}
        </Stack>
      </FieldSchemaMapProvider>
    );
  }

  // Show mode: single labeled group, no individual field labels.
  if (readOnly) {
    const content = (
      <ValueLocationContextProvider value={{isNested: true}}>
        <Stack direction="row" spacing={1} divider={dividerEl} alignItems="center">
          {fields.map((field) => (
            <SchemaWrappedFieldItem field={field} key={field.name} showLabel={false} />
          ))}
        </Stack>
      </ValueLocationContextProvider>
    );

    return (
      <FieldSchemaMapProvider schemaMap={boxFieldSchemaMap}>
        {label ? (
          <Labeled label={<DynamicText>{label}</DynamicText>} fullWidth>
            {content}
          </Labeled>
        ) : (
          content
        )}
      </FieldSchemaMapProvider>
    );
  }

  // Edit/Create mode: mimics a single MUI OutlinedInput
  return (
    <FieldSchemaMapProvider schemaMap={boxFieldSchemaMap}>
      <SchemaWrappedFieldsWritable
        fields={fields}
        divider={divider}
        label={label}
        helperText={helperText}
      />
    </FieldSchemaMapProvider>
  );
};

// Renders all inputs as a single outlined group
// with a shared legend label and aggregated error messages.
const SchemaWrappedFieldsWritable = ({
  fields,
  divider,
  label,
  helperText,
}: SchemaWrappedFieldsWritableProps) => {
  //tady je velký problém, protože se tady používá useFormContext, který je z react-hook-form a ten je v react-adminu obalený do svého vlastního kontextu. Takže když se tady použije useFormContext, tak se dostane do toho kontextu a ne do toho kontextu, který je v react-adminu. A to způsobuje, že se nedostane k chybám validace a k hodnotám formuláře.
  const boxFieldSchemaMap = useFieldSchemaMapContext();
  const record = useRecordContext();

  const fieldNames = useMemo(() => fields.map((field) => field.name), [fields]);

  const {errors} = useFormState({
    name: fieldNames,
    exact: true,
  });

  const fieldValues = useWatch({name: fieldNames});

  const formData = useMemo(
    () => Object.fromEntries(fieldNames.map((name, index) => [name, fieldValues[index]])),
    [fieldNames, fieldValues]
  );
  const data = {...record, ...formData};
  const templateData = {formData, record, data};

  // Collect validation errors from all inner fields.
  // Labels are resolved via templateToStr to support template variables (e.g. %{data.name}).
  const errorMessages = fields.flatMap((field) => {
    const fieldSource = boxFieldSchemaMap[field.name]?.name || field.name;
    const error = get(errors, fieldSource);
    if (!error?.message) return [];
    const rawLabel = field.label || boxFieldSchemaMap[field.name]?.label;
    const fieldLabel = templateToStr(rawLabel, templateData);
    return fieldLabel ? [`${fieldLabel} - ${error.message}`] : [error.message];
  });

  const invalid = errorMessages.length > 0;
  const helper = invalid ? errorMessages.join(', ') : helperText || undefined;

  // Bare mode (`label === false`): a box's `PropertyItem` owns the label beside the group, so the
  // fieldset carries no legend — an empty legend would notch a white gap into the top border — and no
  // legend-seating margins. The group never takes a top gutter (like a plain input), so it lines up
  // with its label / stacks flush inside an iterator.
  const bare = label === false;

  return (
    <Box
      sx={(theme: Theme) => ({
        paddingTop: 0,
        paddingBottom: 0,
        minWidth: '50px',
        width: '100%',
        backgroundColor: varAlpha(theme.palette.background.paperChannel, 0.2),
      })}
    >
      <Stack
        direction="row"
        component="fieldset"
        sx={schemaWrappedFieldSx(bare)}
        alignItems="center"
        className={invalid ? 'SchemaWrappedField-error' : undefined}
      >
        {!bare && (
          <Box component="legend" className="SchemaWrappedField-legend">
            <DynamicText>{label}</DynamicText>
          </Box>
        )}
        {fields.map((field, index) => {
          const rawLabel = field.label || boxFieldSchemaMap[field.name]?.label;
          const fieldLabel = templateToStr(rawLabel, templateData);
          return (
            <React.Fragment key={field.name}>
              {index > 0 && divider && (
                <Box display="flex" alignItems="center" className="SchemaWrappedField-separator">
                  {divider}
                </Box>
              )}
              <Box className="SchemaWrappedField-item">
                <SchemaWrappedFieldItem
                  field={field}
                  label={false}
                  placeholder={fieldLabel}
                  showLabel={false}
                />
              </Box>
            </React.Fragment>
          );
        })}
      </Stack>
      {helper && <FormHelperText error={invalid}>{helper}</FormHelperText>}
    </Box>
  );
};

type SchemaWrappedFieldItemProps = {
  field: FieldDescriptor;
  label?: string | false;
  placeholder?: string;
  showLabel?: boolean;
};

// Renders a single wrapper child. A nested wrapper recurses back into `SchemaWrappedFields` (same
// module — this keeps the wrapper-group dispatch here, off `SchemaFieldOrInput`, which renders a
// single field/input and would otherwise form an import cycle with this module). Everything else is
// a leaf field/input handled by `SchemaFieldOrInput`.
const SchemaWrappedFieldItem = ({
  field,
  label,
  placeholder,
  showLabel,
}: SchemaWrappedFieldItemProps) => {
  if (field.wrapper) {
    return (
      <SchemaWrappedFields
        fields={field.wrapper.fields}
        divider={field.wrapper.divider}
        label={field.label ?? label}
      />
    );
  }

  return (
    <SchemaFieldOrInput
      field={field}
      label={label}
      placeholder={placeholder}
      showLabel={showLabel}
    />
  );
};
