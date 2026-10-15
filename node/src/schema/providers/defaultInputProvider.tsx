import {RichTextInput} from 'ra-input-rich-text';
import React from 'react';
import {BooleanInput} from '@admin/components/inputs/BooleanInput';
import {ChoicesInput} from '@admin/components/inputs/ChoicesInput';
import {DateInput} from '@admin/components/inputs/DateInput';
import {DateRangeInput} from '@admin/components/inputs/DateRangeInput';
import {DateTimeInput} from '@admin/components/inputs/DateTimeInput';
import {NumberInput} from '@admin/components/inputs/NumberInput';
import {PhoneNumberInput} from '@admin/components/inputs/PhoneNumberInput';
import {SearchInput} from '@admin/components/inputs/SearchInput';
import {TextInput} from '@admin/components/inputs/TextInput';
import {TimeInput} from '@admin/components/inputs/TimeInput';
import {TriStateBooleanInput} from '@admin/components/inputs/TriStateBooleanInput';
import {UploadInput, UploadInputProps} from '@admin/components/inputs/UploadInput';
import {InputProps} from '@admin/components/inputs/types';
import {SchemaArrayInput} from '@schema/components/inputs/SchemaArrayInput';
import {SchemaObjectArrayInput} from '@schema/components/inputs/SchemaObjectArrayInput';
import {SchemaObjectInput} from '@schema/components/inputs/SchemaObjectInput';
import {SchemaRangeInput} from '@schema/components/inputs/SchemaRangeInput';
import {SchemaReferenceInput} from '@schema/components/inputs/SchemaReferenceInput';
import {DEFAULT_IMAGE_ACCEPT} from '@schema/components/inputs/constants';
import {AdminInputProviderProps} from '@schema/providers/types';
import {FieldFormatType, FieldOptions, FieldSchema} from '@schema/types';

type InputParams = {
  format?: FieldFormatType;
  schema?: FieldSchema;
  locale?: string;
  options?: FieldOptions;
  rest: Omit<InputProps, 'options'>;
};

type StringInputRenderer = (p: {
  rest: Omit<InputProps, 'options'>;
  options?: FieldOptions;
  schema?: FieldSchema;
  locale?: string;
}) => React.ReactElement;

// `integer`/`type: "integer"` → no fraction digits; otherwise 2–5, with a schema `numberFormat`
// merged over per key. Mirrors `defaultFieldProvider`'s display-side defaults.
const numberFormat = (integer: boolean, options?: FieldOptions): Intl.NumberFormatOptions => {
  const fractionDefaults: Intl.NumberFormatOptions = integer
    ? {maximumFractionDigits: 0, minimumFractionDigits: 0}
    : {maximumFractionDigits: 5, minimumFractionDigits: 2};
  return {...fractionDefaults, ...(options?.number || {})};
};

// `base64-image` enables the image preview and defaults the accept list; a single (object) field
// caps at one file, an array field passes its own `maxFiles` through (unset = unlimited). Only
// `source` / `label` / `helperText` / `readOnly` are forwarded from `rest` — matches the field this
// replaces, which never forwarded the rest of `InputProps` (`validate`, `fullWidth`, …) either.
const uploadInputProps = (
  format: FieldFormatType | undefined,
  options: FieldOptions | undefined,
  multiple: boolean | undefined,
  rest: Omit<InputProps, 'options'>
): UploadInputProps => {
  const isImage = format === 'base64-image';
  return {
    source: rest.source,
    label: rest.label,
    helperText: rest.helperText,
    readOnly: rest.readOnly,
    maxFiles: multiple ? options?.maxFiles : 1,
    accept: options?.accept ?? (isImage ? DEFAULT_IMAGE_ACCEPT : undefined),
    maxFileSize: options?.maxSize,
    upload: options?.upload,
    resizeWidth: options?.image?.resizeWidth,
    cropAspectRatio: options?.image?.cropAspectRatio,
    showImagePreview: isImage,
  };
};

const stringInputMap: Partial<Record<string, StringInputRenderer>> = {
  email: ({rest, options}) => (
    <TextInput type="email" prefix={options?.prefix} postfix={options?.postfix} {...rest} />
  ),
  url: ({rest, options}) => (
    <TextInput type="url" prefix={options?.prefix} postfix={options?.postfix} {...rest} />
  ),
  password: ({rest, options}) => (
    <TextInput type="password" prefix={options?.prefix} postfix={options?.postfix} {...rest} />
  ),
  date: ({rest}) => <DateInput {...rest} />,
  'date-time': ({rest}) => <DateTimeInput {...rest} />,
  time: ({rest}) => <TimeInput {...rest} />,
  text: ({rest, options}) => (
    <TextInput multiline prefix={options?.prefix} postfix={options?.postfix} {...rest} />
  ),
  'rich-text': ({rest}) => <RichTextInput {...rest} defaultValue={undefined} />,
  phone: ({rest, options}) => (
    <PhoneNumberInput
      defaultRegion={options?.phone?.defaultRegion}
      allowedRegions={options?.phone?.allowedRegions}
      {...rest}
    />
  ),
  search: ({rest, schema}) => <SearchInput {...rest} label={false} placeholder={schema?.label} />,
};

const renderIntegerInput = ({format, schema, locale, options, rest}: InputParams) => {
  if (format === 'relation' || format === 'tree-relation') {
    return <SchemaReferenceInput {...rest} reference={schema?.reference} options={options} />;
  }
  if (format === 'choices' && schema?.enum) {
    return <ChoicesInput {...rest} iconsKey={options?.choices?.iconsKey} choices={schema.enum} />;
  }
  return (
    <NumberInput
      locales={locale}
      numberFormat={numberFormat(true, options)}
      prefix={options?.prefix}
      postfix={options?.postfix}
      {...rest}
    />
  );
};

const renderStringInput = ({format, schema, locale, options, rest}: InputParams) => {
  if (format === 'relation' || format === 'tree-relation') {
    return <SchemaReferenceInput {...rest} reference={schema?.reference} options={options} />;
  }
  if (format === 'choices' && schema?.enum) {
    return <ChoicesInput {...rest} iconsKey={options?.choices?.iconsKey} choices={schema.enum} />;
  }
  if (format === 'decimal') {
    return (
      <NumberInput
        locales={locale}
        numberFormat={numberFormat(false, options)}
        prefix={options?.prefix}
        postfix={options?.postfix}
        {...rest}
      />
    );
  }
  const renderer = format ? stringInputMap[format] : undefined;
  if (renderer) return renderer({rest, options, schema, locale});
  return <TextInput prefix={options?.prefix} postfix={options?.postfix} {...rest} />;
};

const renderObjectInput = ({format, schema, locale, options, rest}: InputParams) => {
  if (format === 'base64-image')
    return <UploadInput {...uploadInputProps(format, options, false, rest)} />;
  if (format === 'base64-file')
    return <UploadInput {...uploadInputProps(format, options, false, rest)} />;
  if (format === 'range' && schema?.properties) {
    if (schema.properties?.every((f: FieldSchema) => f.format === 'date')) {
      return <DateRangeInput {...rest} locales={locale} />;
    }
    return <SchemaRangeInput {...rest} fields={schema.properties} />;
  }
  if (schema?.properties) {
    return <SchemaObjectInput {...rest} fields={schema.properties} />;
  }
  return undefined;
};

const renderArrayInput = ({schema, rest}: InputParams) => {
  if (!schema?.items) return undefined;
  if (schema.items.type === 'object') {
    if (schema.items.format === 'base64-image') {
      return (
        <UploadInput {...uploadInputProps(schema.items.format, schema.items.options, true, rest)} />
      );
    }
    if (schema.items.format === 'base64-file') {
      return (
        <UploadInput {...uploadInputProps(schema.items.format, schema.items.options, true, rest)} />
      );
    }
    return <SchemaObjectArrayInput {...rest} items={schema.items} />;
  }
  return <SchemaArrayInput {...rest} items={schema.items} />;
};

export const defaultInputProvider = ({
  type,
  format,
  schema,
  locale,
  isFilter,
  props,
}: AdminInputProviderProps) => {
  // `options` now lives only on the schema — admin input props no longer carry it (HAB-668 0A).
  const options = schema?.options;
  const rest = props;
  const params: InputParams = {format, schema, locale, options, rest};

  switch (type) {
    case 'boolean':
      return isFilter ? <TriStateBooleanInput {...rest} /> : <BooleanInput {...rest} />;
    case 'number':
      return (
        <NumberInput
          locales={locale}
          numberFormat={numberFormat(false, options)}
          prefix={options?.prefix}
          postfix={options?.postfix}
          {...rest}
        />
      );
    case 'integer':
      return renderIntegerInput(params);
    case 'string':
      return renderStringInput(params);
    case 'object':
      return renderObjectInput(params);
    case 'array':
      return renderArrayInput(params);
    default:
      return undefined;
  }
};
