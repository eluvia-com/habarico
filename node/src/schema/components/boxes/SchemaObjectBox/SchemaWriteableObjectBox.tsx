import React, {useEffect, useMemo} from 'react';
import {SourceContextProvider, SourceContextValue, useSourceContext} from 'react-admin';
import {useFormContext, useWatch} from 'react-hook-form';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useFormInputSourcesRegistration} from '@admin/contexts/FormInputSourcesContext/useFormInputSourcesContext';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxChildren} from '@schema/components/boxes/SchemaBoxChildren';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useDynamicFormData} from '@schema/components/dynamic/hooks/useDynamicFormData';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {FieldSchemaMap} from '@schema/types';
import {buildBoxDefaultValues, createConditionFunction} from '@schema/utils/api';
import {SchemaAddItemButton} from './SchemaAddItemButton';
import {SchemaRemoveItemButton} from './SchemaRemoveItemButton';

export const SchemaWriteableObjectBox = ({
  schema,
  excludeFields,
  label = schema.label,
  isRoot,
}: SchemaBoxProps) => {
  const fieldSchemas = useFieldSchemaMapContext();
  const objectSource = schema.object?.target || '';

  const requiredQuery = schema.options?.dynamicRender?.requiredQuery;
  // Scoped to the paths `requiredQuery` reads - the same hook every other box's `required_query`
  // goes through. Not `getValues()`: it neither subscribes (so `isRequired` would never update) nor
  // has the shape `evaluateConditionExpression` needs — that resolves `data.foo` against the
  // `{data, record, formData, …}` tree this hook builds, and a flat value object silently evaluates
  // every query to `undefined`.
  const dynamicData = useDynamicFormData([requiredQuery]);
  const parentSourceContext = useSourceContext();

  const finalSource = parentSourceContext.getSource(objectSource);

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

  const value = useWatch({name: finalSource});
  const {setValue} = useFormContext();

  const {register, unregister} = useFormInputSourcesRegistration();
  useEffect(() => {
    if (!finalSource || !register || !unregister) return;
    register(finalSource);
    return () => unregister(finalSource);
  }, [finalSource, register, unregister]);

  const targetFieldSchema = fieldSchemas[objectSource];

  const initialObjectValue = useMemo(() => {
    if (!targetFieldSchema?.properties) return {};
    return buildBoxDefaultValues(schema, targetFieldSchema.properties, null);
  }, [schema, targetFieldSchema]);

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

  if (!targetFieldSchema || !targetFieldSchema.properties || !objectSource) return;

  const isRequired =
    !targetFieldSchema.nullable ||
    (requiredQuery && createConditionFunction(requiredQuery)(dynamicData));

  const addButton = (
    <SchemaAddItemButton onClick={() => setValue(finalSource, initialObjectValue)} />
  );
  const removeButton = <SchemaRemoveItemButton onClick={() => setValue(finalSource, null)} />;

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  return (
    <SourceContextProvider value={sourceContext}>
      <FieldSchemaMapProvider schemaMap={targetFieldSchemaMap}>
        <BoxLayout
          schema={schema}
          card={card}
          label={label ? <DynamicText>{label}</DynamicText> : undefined}
          action={
            hasToolbarActions || !isRequired ? (
              <>
                {hasToolbarActions && (
                  <SchemaButtons
                    size="small"
                    variant="contained"
                    descriptors={schema.toolbarActions}
                  />
                )}
                {!isRequired && (
                  <>
                    {!value && addButton}
                    {value && removeButton}
                  </>
                )}
              </>
            ) : undefined
          }
          footerRight={
            hasBottomActions ? (
              <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
            ) : undefined
          }
        >
          {(isRequired || value) && (
            <SchemaBoxChildren boxes={schema.boxes || []} excludeFields={excludeFields} />
          )}
        </BoxLayout>
      </FieldSchemaMapProvider>
    </SourceContextProvider>
  );
};
