import React, {useMemo} from 'react';
import {useRecordContext} from 'react-admin';
import {SchemaButton} from '@schema/components/buttons/SchemaButton';
import {useResolvedDescriptors} from '@schema/hooks/useResolvedDescriptors';
import {ActionDescriptor, ActionSchema, HabRecord} from '@schema/types';
import {isActionDescriptor} from '@schema/utils/actionDescriptor';

type SchemaActionFieldProps = {
  /** Either the action itself, or a descriptor naming one to look up on the record's schema. */
  action: ActionDescriptor | ActionSchema;
  variant?: 'text' | 'outlined' | 'contained';
  // Collapse the action button to icon-only (used in datagrid cells).
  showLabel?: boolean;
};

export const SchemaActionField = ({
  action: actionOrDescriptor,
  variant,
  showLabel,
}: SchemaActionFieldProps) => {
  const record = useRecordContext<HabRecord>();
  const descriptor = isActionDescriptor(actionOrDescriptor) ? actionOrDescriptor : undefined;
  const inlineAction = isActionDescriptor(actionOrDescriptor) ? undefined : actionOrDescriptor;
  const descriptors = useMemo(() => (descriptor ? [descriptor] : []), [descriptor]);
  const [resolvedDescriptor] = useResolvedDescriptors({descriptors, record}).resolvedDescriptors;

  // A descriptor the record's schema does not carry - unknown, not permitted, or its reference
  // still loading - resolves to nothing and renders nothing.
  const schema = resolvedDescriptor?.schema ?? inlineAction;
  if (!schema) return;

  // No `showQuery` here: the button is always the value of a slot someone else owns — a datagrid
  // cell (`SchemaFieldOrInput`) or a detail row (`SchemaPropertyItem`) — and that owner hides it.
  // A field action always renders inline with data, never in a toolbar, so it asks for the in-row
  // size rather than the default one.
  return (
    <SchemaButton
      schema={schema}
      actionContext={resolvedDescriptor?.actionContext}
      variant={variant}
      showLabel={showLabel}
      size={'small'}
    />
  );
};
