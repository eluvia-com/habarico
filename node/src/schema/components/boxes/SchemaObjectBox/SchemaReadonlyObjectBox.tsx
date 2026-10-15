import React, {useMemo} from 'react';
import {
  RecordContextProvider,
  SourceContextProvider,
  SourceContextValue,
  useRecordContext,
  useSourceContext,
} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxChildren} from '@schema/components/boxes/SchemaBoxChildren';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {FieldSchemaMap} from '@schema/types';

export const SchemaReadonlyObjectBox = ({
  schema,
  excludeFields,
  label = schema.label,
  isRoot,
}: SchemaBoxProps) => {
  const fieldSchemas = useFieldSchemaMapContext();
  const record = useRecordContext();
  const parentSourceContext = useSourceContext();
  const objectSource = schema.object?.target || '';

  const targetFieldSchema = fieldSchemas[objectSource];

  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => {
        if (!source) {
          return parentSourceContext.getSource(objectSource);
        }
        return parentSourceContext.getSource(`${objectSource}.${source}`);
      },
      getLabel: (source: string) => parentSourceContext.getLabel(`${objectSource}.${source}`),
    }),
    [parentSourceContext, objectSource]
  );

  const card = useBoxCard(schema, Boolean(label), isRoot);

  // Memoized: `FieldSchemaMapProvider` does not memoize its own `value`, so a fresh map here would
  // invalidate the context for every descendant field. Before the early return below, because a hook
  // cannot sit after a conditional one.
  const targetFieldSchemaMap = useMemo(() => {
    if (!targetFieldSchema?.properties) return {} as FieldSchemaMap;
    return targetFieldSchema.properties.reduce((acc, field) => {
      acc[field.name!] = field;
      return acc;
    }, {} as FieldSchemaMap);
  }, [targetFieldSchema]);

  if (!targetFieldSchema || !targetFieldSchema.properties || !record || !objectSource) return;

  const value = record[objectSource];

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  return (
    <SourceContextProvider value={sourceContext}>
      <FieldSchemaMapProvider schemaMap={targetFieldSchemaMap}>
        <RecordContextProvider value={value}>
          <BoxLayout
            schema={schema}
            card={card}
            label={label ? <DynamicText>{label}</DynamicText> : undefined}
            action={
              hasToolbarActions ? (
                <SchemaButtons
                  size="small"
                  variant="contained"
                  descriptors={schema.toolbarActions}
                />
              ) : undefined
            }
            footerRight={
              hasBottomActions ? (
                <SchemaButtons
                  size="medium"
                  variant="contained"
                  descriptors={schema.bottomActions}
                />
              ) : undefined
            }
          >
            {value && (
              <SchemaBoxChildren boxes={schema.boxes || []} excludeFields={excludeFields} />
            )}
          </BoxLayout>
        </RecordContextProvider>
      </FieldSchemaMapProvider>
    </SourceContextProvider>
  );
};
