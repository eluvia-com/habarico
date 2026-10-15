import React from 'react';
import {ChoicesField} from '@admin/components/fields/ChoicesField';
import {FieldProps} from '@admin/components/fields/types';
import {Choices} from '@admin/utils/choices';
import {FieldOptions} from '@schema/types';

export type SchemaChoicesFieldProps = Omit<FieldProps, 'options'> & {
  options?: FieldOptions;
  choices: Choices;
};

/**
 * Schema adapter for the admin `ChoicesField` — reads `FieldOptions.choices.iconsKey` and maps it
 * onto the field's explicit `iconsKey` prop; the resolved `choices` come from the field `enum`.
 */
export const SchemaChoicesField = ({options, ...rest}: SchemaChoicesFieldProps) => (
  <ChoicesField {...rest} iconsKey={options?.choices?.iconsKey} />
);
