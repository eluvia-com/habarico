import React from 'react';
import {BooleanField, BooleanFieldProps} from '@admin/components/fields/BooleanField';
import {useFieldDefaults} from '@schema/contexts/FieldDefaultsContext';

export type SchemaBooleanFieldProps = BooleanFieldProps;

/**
 * Schema adapter for the admin `BooleanField` — the only thing it adds is the application's chosen
 * shape: `variant` falls back to `fieldDefaults.boolean` instead of straight to `'chip'`, so a
 * project renders every boolean as plain text (or as a glyph in its lists) with one prop on
 * `SchemaAdmin`, and keeps a per-field `variant` for the exceptions.
 *
 * The schema says nothing about which shape a boolean takes — there is no `format` to dispatch on
 * and no option for it in the contract — which is exactly why it is the application's call.
 */
export const SchemaBooleanField = ({variant, ...rest}: SchemaBooleanFieldProps) => {
  const {boolean: defaultVariant} = useFieldDefaults();

  return <BooleanField variant={variant ?? defaultVariant} {...rest} />;
};
