import React, {useMemo} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {FieldSchemaMap} from '@schema/types';
import {SchemaReadonlyArrayBox} from './SchemaReadonlyArrayBox';
import {SchemaWriteableArrayBox} from './SchemaWriteableArrayBox';

export const SchemaArrayBox = ({schema, label = schema.label, isRoot}: SchemaBoxProps) => {
  const isLast = useIsLastPanel();
  const arrayProperties = schema.array!;
  const fieldSchemas = useFieldSchemaMapContext();
  const targetFieldSchema = fieldSchemas[arrayProperties.target];

  const {readOnly: readOnlyView} = useViewSchemaContext();
  const card = useBoxCard(schema, Boolean(label), isRoot);

  // Memoized: `FieldSchemaMapProvider` does not memoize its own `value`, so a fresh map here would
  // invalidate the context for every field and input inside the array's rows. Before the early
  // return below, because a hook cannot sit after a conditional one.
  const targetFieldSchemaMap = useMemo(() => {
    if (!targetFieldSchema?.items?.properties) return {} as FieldSchemaMap;
    return targetFieldSchema.items.properties.reduce((acc, field) => {
      acc[field.name!] = field;
      return acc;
    }, {} as FieldSchemaMap);
  }, [targetFieldSchema]);

  if (!targetFieldSchema || !targetFieldSchema.items?.properties) return;

  const readOnly = readOnlyView || targetFieldSchema.readOnly;

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  // Content padding by mode:
  //  - edit: a form, so the standard medium gutter around the inputs.
  //  - read + inline: a full-bleed datagrid (edge-to-edge — the `array` type's flush default).
  //  - read + non-inline: nested-panel rows in a small (8px) even gutter.
  const isInline = Boolean(schema.array?.inline);
  const readPaddingSize = isInline ? undefined : 'small';
  const paddingSize = readOnly ? readPaddingSize : 'medium';
  const flush = readOnly && isInline ? undefined : false;

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      paddingSize={paddingSize}
      flush={flush}
      action={
        hasToolbarActions ? (
          <SchemaButtons size="small" variant="contained" descriptors={schema.toolbarActions} />
        ) : undefined
      }
      footerRight={
        hasBottomActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        ) : undefined
      }
      fullHeight={isLast}
    >
      <FieldSchemaMapProvider schemaMap={targetFieldSchemaMap}>
        {readOnly ? (
          <SchemaReadonlyArrayBox schema={schema} targetFieldSchema={targetFieldSchema} />
        ) : (
          <SchemaWriteableArrayBox schema={schema} targetFieldSchema={targetFieldSchema} />
        )}
      </FieldSchemaMapProvider>
    </BoxLayout>
  );
};
