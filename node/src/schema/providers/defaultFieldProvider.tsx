import React from 'react';
import {FileField, RichTextField} from 'react-admin';
import {DateField} from '@admin/components/fields/DateField';
import {EmailField} from '@admin/components/fields/EmailField';
import {ImageField} from '@admin/components/fields/ImageField';
import {NumberField} from '@admin/components/fields/NumberField';
import {PhoneNumberField} from '@admin/components/fields/PhoneNumberField';
import {TextField} from '@admin/components/fields/TextField';
import {TimeField} from '@admin/components/fields/TimeField';
import {UrlField} from '@admin/components/fields/UrlField';
import {FieldProps} from '@admin/components/fields/types';
import {SchemaBooleanField} from '@schema/components/fields/SchemaBooleanField';
import {SchemaChipArrayField} from '@schema/components/fields/SchemaChipArrayField';
import {SchemaChoicesField} from '@schema/components/fields/SchemaChoicesField';
import {SchemaObjectArrayField} from '@schema/components/fields/SchemaObjectArrayField';
import {SchemaObjectField} from '@schema/components/fields/SchemaObjectField';
import {SchemaRangeField} from '@schema/components/fields/SchemaRangeField';
import {SchemaReferenceArrayField} from '@schema/components/fields/SchemaReferenceArrayField';
import {SchemaReferenceField} from '@schema/components/fields/SchemaReferenceField';
import {AdminFieldProviderProps} from '@schema/providers/types';
import {FieldOptions} from '@schema/types';

type FieldParams = Omit<AdminFieldProviderProps, 'type' | 'props'> & {
  options?: FieldOptions;
  rest: Omit<FieldProps, 'options'>;
};

// `integer`/`type: "integer"` → no fraction digits; otherwise 2–5, with a schema `numberFormat`
// merged over per key. Mirrors `defaultInputProvider`'s input-side defaults.
const numberFormat = (integer: boolean, options?: FieldOptions): Intl.NumberFormatOptions => {
  const fractionDefaults: Intl.NumberFormatOptions = integer
    ? {maximumFractionDigits: 0, minimumFractionDigits: 0}
    : {maximumFractionDigits: 5, minimumFractionDigits: 2};
  return {...fractionDefaults, ...(options?.number || {})};
};

const renderIntegerField = ({format, schema, locale, isInList, options, rest}: FieldParams) => {
  if (format === 'relation' || format === 'tree-relation') {
    return (
      <SchemaReferenceField
        reference={schema?.reference}
        targetSource={schema?.targetSource}
        options={options}
        {...rest}
      />
    );
  }
  if (format === 'choices' && schema?.enum) {
    return <SchemaChoicesField {...rest} choices={schema.enum} options={options} />;
  }
  return (
    <NumberField
      locales={locale}
      numberFormat={numberFormat(true, options)}
      prefix={options?.prefix}
      postfix={options?.postfix}
      {...rest}
      textAlign={listTextAlign(isInList, options)}
    />
  );
};

const listTextAlign = (isInList: boolean | undefined, options?: FieldOptions) =>
  isInList ? options?.textAlign || 'right' : undefined;

const renderStringField = ({format, schema, locale, isInList, options, rest}: FieldParams) => {
  if (format === 'relation' || format === 'tree-relation') {
    return (
      <SchemaReferenceField
        reference={schema?.reference}
        targetSource={schema?.targetSource}
        options={options}
        {...rest}
      />
    );
  }
  if (format === 'email') return <EmailField {...rest} />;
  if (format === 'url') return <UrlField {...rest} />;
  if (format === 'date') {
    return <DateField locales={locale} textAlign={listTextAlign(isInList, options)} {...rest} />;
  }
  if (format === 'date-time') {
    return (
      <DateField showTime locales={locale} textAlign={listTextAlign(isInList, options)} {...rest} />
    );
  }
  if (format === 'time') {
    return <TimeField locales={locale} textAlign={listTextAlign(isInList, options)} {...rest} />;
  }
  if (format === 'rich-text') return <RichTextField {...rest} />;
  if (format === 'choices' && schema?.enum) {
    return <SchemaChoicesField {...rest} choices={schema.enum} options={options} />;
  }
  if (format === 'decimal') {
    return (
      <NumberField
        locales={locale}
        numberFormat={numberFormat(false, options)}
        prefix={options?.prefix}
        postfix={options?.postfix}
        {...rest}
        textAlign={listTextAlign(isInList, options)}
      />
    );
  }
  if (format === 'phone') return <PhoneNumberField {...rest} />;
  if (format === 'text') {
    return <TextField multiline prefix={options?.prefix} postfix={options?.postfix} {...rest} />;
  }
  return <TextField prefix={options?.prefix} postfix={options?.postfix} {...rest} />;
};

const renderObjectField = ({format, schema, source, isInList, options, rest}: FieldParams) => {
  if (format === 'base64-image') {
    return <ImageField {...rest} source={`${source}.url`} title={`${source}.filename`} />;
  }
  if (format === 'base64-file') {
    return (
      <FileField
        {...rest}
        target={`_${options?.target ?? 'blank'}`}
        source={`${source}.url`}
        title={`${source}.filename`}
      />
    );
  }
  if (format === 'range' && schema?.properties) {
    return <SchemaRangeField {...rest} fields={schema.properties} />;
  }
  if (!isInList && schema?.properties) {
    return <SchemaObjectField {...rest} fields={schema.properties} />;
  }
  return undefined;
};

const renderArrayField = ({schema, isInList, rest}: FieldParams) => {
  if (!schema?.items) return undefined;
  if (schema.items.type === 'object') {
    if (!isInList) return <SchemaObjectArrayField {...rest} items={schema.items} />;
    return undefined;
  }
  if (schema.items.reference) {
    return <SchemaReferenceArrayField {...rest} items={schema.items} />;
  }
  return (
    <SchemaChipArrayField
      {...rest}
      choices={schema.items.enum}
      iconsKey={schema.items.options?.choices?.iconsKey}
    />
  );
};

export const defaultFieldProvider = ({
  source,
  type,
  isInList,
  format,
  schema,
  locale,
  props,
}: AdminFieldProviderProps) => {
  // `options` now lives only on the schema — admin field props no longer carry it (HAB-668 0A).
  const options = schema?.options;
  const rest = props;
  const params: FieldParams = {source, format, schema, locale, isInList, options, rest};

  switch (type) {
    case 'boolean':
      return <SchemaBooleanField {...rest} />;
    case 'number':
      return (
        <NumberField
          locales={locale}
          numberFormat={numberFormat(false, options)}
          prefix={options?.prefix}
          postfix={options?.postfix}
          {...rest}
        />
      );
    case 'integer':
      return renderIntegerField(params);
    case 'string':
      return renderStringField(params);
    case 'object':
      return renderObjectField(params);
    case 'array':
      return renderArrayField(params);
    default:
      return undefined;
  }
};
