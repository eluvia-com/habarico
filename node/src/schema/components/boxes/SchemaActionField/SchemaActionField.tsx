import React from 'react';
import {useRecordContext} from 'react-admin';
import {SchemaButton} from '@schema/components/buttons/SchemaButton';
import {useLocalResourceSchemaContext} from '@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext';
import {ActionDescriptor, ActionSchema, HabRecord} from '@schema/types';
import {generateActionSchemaMap} from '@schema/utils/api';

type SchemaActionFieldProps = {
  action: ActionDescriptor | ActionSchema;
  variant?: 'text' | 'outlined' | 'contained';
  // Collapse the action button to icon-only (used in datagrid cells).
  showLabel?: boolean;
};

export const SchemaActionField = ({action, variant, showLabel}: SchemaActionFieldProps) => {
  const record = useRecordContext<HabRecord>();
  const {schema} = useLocalResourceSchemaContext();

  const actions = record ? record.meta.schema.actions : schema.actions;
  const schemaMap = generateActionSchemaMap(actions);

  const actionSchema = 'name' in action ? schemaMap[action.name] : action;
  if (!actionSchema) return;

  // No `showQuery` here: the button is always the value of a slot someone else owns — a datagrid
  // cell (`SchemaFieldOrInput`) or a detail row (`SchemaPropertyItem`) — and that owner hides it.
  // A field action always renders inline with data, never in a toolbar, so it asks for the in-row
  // size rather than the default one.
  return (
    <SchemaButton schema={actionSchema} variant={variant} showLabel={showLabel} size={'small'} />
  );
};
