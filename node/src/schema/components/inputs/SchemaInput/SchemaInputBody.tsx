import React, {ReactElement} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {DynamicRequiredWrapper} from '@schema/components/dynamic/DynamicRequiredWrapper';
import {SchemaInputProps} from '@schema/components/inputs/types';
import {SchemaReadonlyInputContent} from './SchemaReadonlyInputContent';
import {SchemaWriteonlyInputContent} from './SchemaWriteonlyInputContent';

export type SchemaInputBodyProps = Omit<SchemaInputProps, 'hiddenEl'>;

/**
 * `SchemaInput` without its own `showQuery` check, for a component that owns the slot the input
 * sits in and evaluates the query itself (`SchemaPropertyItem`, `SchemaFieldOrInput`).
 * `requiredQuery` still applies here: it is a property of the input, not of its slot.
 */
export const SchemaInputBody = ({
  schema,
  label = schema.label,
  helperText = schema.helpText,
  showLabel = true,
  defaultValue,
  ...rest
}: SchemaInputBodyProps) => {
  const {readOnly, source} = rest;

  const rootSource = source?.split('.').slice(0, -1).join('.');

  // Bare mode (`showLabel={false}` or an explicit `label={false}`): the surrounding PropertyItem
  // owns the label, so the input/field renders label-less — `false` suppresses the underlying RA
  // input label and the readonly branch (which also gets `showLabel`) drops its own `Labeled`
  // wrapper. Otherwise the label is the wrapped `label` when set, else `undefined`
  // so the downstream `schema.label` / RA default still applies.
  // The label element is built only when it is used: every schema form field is bare, so building it
  // unconditionally would create and discard one element per field on every render.
  const bare = !showLabel || label === false;
  let labelEl: ReactElement | false | undefined;
  if (bare) {
    labelEl = false;
  } else if (label) {
    labelEl = <DynamicText source={rootSource}>{label}</DynamicText>;
  }

  const contentEl = readOnly ? (
    <SchemaReadonlyInputContent schema={schema} label={labelEl} showLabel={!bare} {...rest} />
  ) : (
    <SchemaWriteonlyInputContent
      schema={schema}
      label={labelEl}
      showLabel={!bare}
      helperText={helperText && <DynamicText source={rootSource}>{helperText}</DynamicText>}
      defaultValue={defaultValue}
      {...rest}
    />
  );

  return (
    <DynamicRequiredWrapper requiredQuery={schema.options?.dynamicRender?.requiredQuery}>
      {contentEl}
    </DynamicRequiredWrapper>
  );
};
