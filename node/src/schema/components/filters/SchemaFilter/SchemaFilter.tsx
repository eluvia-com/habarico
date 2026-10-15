import React, {ReactElement} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {InputProps} from '@admin/components/inputs/types';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {FieldSchemaProvider} from '@schema/contexts/FieldSchemaContext';
import {useFieldSchemaContext} from '@schema/contexts/FieldSchemaContext/useFieldSchemaContext';
import {useGetInput} from '@schema/contexts/ResourceInputContext/useGetInput';
import {FilterSchema} from '@schema/types';

type SchemaFilterContentProps = {
  source: string;
  label?: string | ReactElement | false;
  helpText?: string | ReactElement | false;
  defaultValue?: unknown;
};

const SchemaFilterContent = (props: SchemaFilterContentProps) => {
  const schema = useFieldSchemaContext();
  const getInputEl = useGetInput();

  const {source = schema.name, label = schema.label, helpText = schema.helpText || ''} = props;

  const resource = useResourceContext();
  const rootSource = source?.split('.').slice(0, -1).join('.');

  const inputProps: InputProps = {
    label: <DynamicText source={rootSource}>{label}</DynamicText>,
    helperText: <DynamicText source={rootSource}>{helpText}</DynamicText>,
    source,
    fullWidth: true,
    size: 'small',
  };

  const inputEl = getInputEl({
    resource,
    source,
    type: schema.type,
    format: schema.format,
    schema,
    props: inputProps,
    isFilter: true,
  });
  // `null` = a provider deliberately disabled this input, which is intentional
  // and stays silent.
  if (inputEl === null) return null;

  // `undefined` = no input is registered for this type/format (likely a schema
  // gap): the filter still counts towards the filter button but renders nothing,
  // so surface it during development.
  if (inputEl === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `SchemaFilter: no input resolved for filter "${source}" (type="${schema.type}", format="${schema.format}"). It will not render.`
      );
    }
    return null;
  }

  return inputEl;
};

export type SchemaFilterProps = {
  schema: FilterSchema;
  source: string;
  label?: string | ReactElement | false;
  alwaysOn?: boolean;
  defaultValue?: unknown;
};

export const SchemaFilter = ({schema, source, label, defaultValue}: SchemaFilterProps) => {
  return (
    <FieldSchemaProvider schema={schema}>
      <SchemaFilterContent source={source} label={label} defaultValue={defaultValue} />
    </FieldSchemaProvider>
  );
};
