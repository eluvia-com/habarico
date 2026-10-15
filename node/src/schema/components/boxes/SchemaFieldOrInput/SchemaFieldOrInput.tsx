import React, {ReactElement} from 'react';
import {useValueLocationContext} from '@design/contexts/ValueLocationContext';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {FieldDescriptor} from '@schema/types';
import {SchemaActionField} from '../SchemaActionField';
import {SchemaFieldOrInputContent} from '../SchemaFieldOrInputContent';

export type SchemaFieldOrInputProps = {
  field: FieldDescriptor;
  sortable?: boolean;
  label?: string | false;
  source?: string;
  showLabel?: boolean;
  placeholder?: string;
  helperText?: string | ReactElement | false;
};

export const SchemaFieldOrInput = ({
  source,
  showLabel,
  field,
  ...rest
}: SchemaFieldOrInputProps) => {
  const fieldSchemaMap = useFieldSchemaMapContext();
  const {isInCollection} = useValueLocationContext();

  // Render field or input according to field schema and descriptor
  const fieldSchema = fieldSchemaMap[field.name];
  const fieldSource = source || fieldSchema?.name || field.name;

  // This component owns the slot (a datagrid cell, a field inside a wrapper group), so it evaluates
  // `showQuery` once here — for an action off the descriptor, for a field off its resolved schema —
  // and renders the value without a check of its own.

  if (field.action) {
    return (
      <DynamicRenderWrapper showQuery={field.options?.dynamicRender?.showQuery}>
        <SchemaActionField action={field.action} showLabel={isInCollection ? false : undefined} />
      </DynamicRenderWrapper>
    );
  }

  if (!fieldSchema) return;

  return (
    <DynamicRenderWrapper showQuery={fieldSchema.options?.dynamicRender?.showQuery}>
      <SchemaFieldOrInputContent
        schema={fieldSchema}
        source={fieldSource}
        showLabel={showLabel}
        {...rest}
      />
    </DynamicRenderWrapper>
  );
};
