import React from 'react';
import {useRecordContext, useSourceContext} from 'react-admin';
import {ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useStrTemplate} from '@admin/hooks/useStrTemplate';
import {Icon, IconType} from '@design/atoms/Icon';
import {ActionResourceProvider} from '@schema/components/buttons/ActionResourceProvider';
import {ActionSchemaProvider} from '@schema/contexts/ActionSchemaContext';
import {useGetButton} from '@schema/contexts/ResourceButtonContext/useGetButton';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {ActionSchema, ResourceActionSchema} from '@schema/types';
import {ActionContext} from '@schema/utils/actionDescriptor';
import {resourceKey} from '@schema/utils/resourceReference';

export type SchemaButtonProps = Omit<ActionButtonProps, 'color' | 'label'> & {
  schema: ActionSchema | ResourceActionSchema;
  target?: string;
  isMenu?: boolean;
  onSuccess?: () => void;
  // a linked action runs against this resource and record, not the surrounding ones
  actionContext?: ActionContext;
};

const SchemaButtonContent = ({
  schema,
  target,
  showLabel,
  isMenu,
  surface,
  actionContext,
  ...rest
}: SchemaButtonProps) => {
  // Compose button props
  const label = useStrTemplate(schema.label) as string | undefined;

  // Only the icon the schema asks for. Without one the prop stays unset, so the concrete button
  // applies its own default - a view button resolves it from the target view type, the link/save/
  // export/upload buttons carry theirs. Materialising a fallback here would shadow all of them.
  const icon = schema.icon ? <Icon icon={schema.icon as IconType} /> : undefined;

  const sourceContext = useSourceContext();
  const rootSource = sourceContext.getSource('');

  const buttonProps: ActionButtonProps = {
    icon,
    label: label && <DynamicText source={rootSource}>{label}</DynamicText>,
    color: schema.color ?? 'inherit', // default to 'inherit' if not specified
    confirm: schema.confirmDialog
      ? {title: schema.confirmDialog.title, content: schema.confirmDialog.message}
      : undefined,
    showLabel: showLabel,
    // Inside an overflow menu it is always a `menuItem`; otherwise honour an explicit `surface`
    // override (e.g. datagrid row actions render as `iconButton`) and fall back to `button`.
    surface: isMenu ? 'menuItem' : (surface ?? 'button'),
    ...rest,
  };

  // Get resource and reference context
  const resource = useResourceContext();
  const reference = useResourceContext(
    resourceKey(schema.view?.endpoint ?? schema.resource?.endpoint?.reference)
  );
  const {getGlobalViewSchema} = useGlobalResourceSchemaContext(reference);
  const viewSchema = getGlobalViewSchema(schema.view?.name);

  // Get record primary key
  const record = useRecordContext();
  // a linked action takes its record from the link, never from the surrounding record context
  const boundRecordPk = actionContext ? actionContext.recordPk : record?.id;
  const recordPk = resource === reference && schema.isDetail ? boundRecordPk : undefined;

  // Create final button element
  const getButtonEl = useGetButton();
  const buttonEl = getButtonEl({
    schema,
    resource,
    reference,
    viewSchema,
    recordPk,
    target,
    props: buttonProps,
  });

  if (!buttonEl) return;
  return <ActionSchemaProvider schema={schema}>{buttonEl}</ActionSchemaProvider>;
};

export const SchemaButton = ({actionContext, ...props}: SchemaButtonProps) =>
  actionContext ? (
    <ActionResourceProvider actionContext={actionContext}>
      <SchemaButtonContent
        {...props}
        target={props.target ?? actionContext.parent?.target}
        actionContext={actionContext}
      />
    </ActionResourceProvider>
  ) : (
    <SchemaButtonContent {...props} />
  );
