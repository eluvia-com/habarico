import React from 'react';
import {TextInput} from 'react-admin';
import {ChoicesArrayInput} from '@admin/components/inputs/ChoicesArrayInput';
import {InputProps} from '@admin/components/inputs/types';
import {useFieldSchemaContext} from '@schema/contexts/FieldSchemaContext/useFieldSchemaContext';
import {FieldSchema, ItemFieldSchema} from '@schema/types';
import {SchemaReferenceArrayInput} from './SchemaReferenceArrayInput';

export type SchemaArrayInputProps = InputProps & {
  defaultValue?: unknown;
  items: ItemFieldSchema | FieldSchema;
};

/**
 * Schema-driven dispatcher for array inputs: picks the right editor from the item schema —
 * a reference multi-select, an enum multi-select (the presentational `ChoicesArrayInput`), or a
 * plain comma-separated text fallback. All presentation for the enum case lives in
 * `ChoicesArrayInput` (admin layer); this component only reads the schema and delegates.
 */
export const SchemaArrayInput = ({
  source,
  label,
  validate,
  defaultValue,
  items,
  ...rest
}: SchemaArrayInputProps) => {
  const schema = useFieldSchemaContext();

  if (items.reference) {
    return (
      <SchemaReferenceArrayInput
        source={source}
        label={label}
        validate={validate}
        defaultValue={defaultValue}
        items={items}
        {...rest}
      />
    );
  }
  if (items.format === 'choices' && items.enum) {
    return (
      <ChoicesArrayInput
        source={source}
        label={label}
        validate={validate}
        defaultValue={defaultValue}
        choices={items.enum}
        iconsKey={schema.items?.options?.choices?.iconsKey}
        {...rest}
      />
    );
  }
  return (
    <TextInput
      source={source}
      label={label}
      validate={validate}
      defaultValue={defaultValue}
      parse={(v: string) => v.split(',')}
      {...rest}
    />
  );
};
