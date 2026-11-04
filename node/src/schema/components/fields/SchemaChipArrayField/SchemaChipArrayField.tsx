import React from 'react';
import {ChipArrayField, ChipArrayFieldProps} from '@admin/components/fields/ChipArrayField';
import {useFieldDefaults} from '@schema/contexts/FieldDefaultsContext';

export type SchemaChipArrayFieldProps = ChipArrayFieldProps;

/**
 * Schema adapter for the admin `ChipArrayField`: `variant` falls back to `fieldDefaults.choices`,
 * the same key the single-value `SchemaChoicesField` reads, so an array of choices and a single
 * choice are never rendered in two different shapes within one project. It covers the raw-value
 * branch of the field too (an array with no `enum` behind it), which has no color to lose.
 */
export const SchemaChipArrayField = ({variant, ...rest}: SchemaChipArrayFieldProps) => {
  const {choices: defaultVariant} = useFieldDefaults();

  return <ChipArrayField variant={variant ?? defaultVariant} {...rest} />;
};
