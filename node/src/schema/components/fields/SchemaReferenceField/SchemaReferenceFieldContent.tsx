import React, {ReactElement} from 'react';
import {LinearProgress, TextField, useTranslate} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {SchemaField} from '@schema/components/fields/SchemaField';
import {useGetLocalResourceSchema} from '@schema/hooks/useGetLocalResourceSchema';
import {FieldOptions} from '@schema/types';

type SchemaReferenceFieldContentProps = {
  source: string;
  reference: string;
  textAlign?: 'left' | 'right' | 'center';
  label?: string | ReactElement | false;
  options?: FieldOptions;
};

export const SchemaReferenceFieldContent = ({
  reference,
  label,
  source,
  textAlign,
  options = {},
}: SchemaReferenceFieldContentProps) => {
  const {isLoading, isError, error, getFieldSchema} = useGetLocalResourceSchema({
    resource: reference,
  });
  const translate = useTranslate();

  if (isLoading) {
    return <LinearProgress />;
  }
  if (isError) {
    return (
      <Icon
        icon={IconType.Warning}
        titleAccess={error ? error.message : translate('ra.message.schema_error')}
      />
    );
  } else {
    const fieldSchema = getFieldSchema('get', source);
    if (!fieldSchema) return <TextField source={source} textAlign={textAlign} />;
    const fieldSchemaWithOptions = {
      ...fieldSchema,
      options: {
        ...fieldSchema.options,
        ...options,
      },
    };

    return (
      <SchemaField
        source={source}
        schema={fieldSchemaWithOptions}
        label={label}
        textAlign={textAlign}
      />
    );
  }
};
