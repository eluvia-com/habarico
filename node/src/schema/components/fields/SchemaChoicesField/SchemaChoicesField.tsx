import React from 'react';
import {ChoicesField} from '@admin/components/fields/ChoicesField';
import {FieldProps} from '@admin/components/fields/types';
import {Choices} from '@admin/utils/choices';
import {useFieldDefaults} from '@schema/contexts/FieldDefaultsContext';
import {ChoicesVariant, FieldOptions} from '@schema/types';

export type SchemaChoicesFieldProps = Omit<FieldProps, 'options'> & {
  options?: FieldOptions;
  choices: Choices;
  /** Falls back to `fieldDefaults.choices`; an explicit value wins over it. */
  variant?: ChoicesVariant;
};

/**
 * Schema adapter for the admin `ChoicesField` — reads `FieldOptions.choices.iconsKey` and maps it
 * onto the field's explicit `iconsKey` prop; the resolved `choices` come from the field `enum`.
 * `variant` falls back to `fieldDefaults.choices`; the rule that a colored enum keeps its chips
 * even under `'text'` is the admin component's own.
 */
export const SchemaChoicesField = ({options, variant, ...rest}: SchemaChoicesFieldProps) => {
  const {choices: defaultVariant} = useFieldDefaults();

  return (
    <ChoicesField
      {...rest}
      variant={variant ?? defaultVariant}
      iconsKey={options?.choices?.iconsKey}
    />
  );
};
