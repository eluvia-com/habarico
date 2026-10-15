import React from 'react';
import {ArrayInput as RaArrayInput} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaArrayBox} from '@schema/components/boxes/SchemaArrayBox';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {SchemaChoicesFormIterator} from './SchemaChoicesFormIterator';

export const SchemaChoicesArrayBox = ({schema, label = schema.label, isRoot}: SchemaBoxProps) => {
  const target = schema.array?.target;
  const fieldSchemas = useFieldSchemaMapContext();
  const targetFieldSchema = fieldSchemas[target || ''];
  const isLast = useIsLastPanel();

  const {readOnly: readOnlyView} = useViewSchemaContext();
  const card = useBoxCard(schema, Boolean(label), isRoot);

  if (!target || !targetFieldSchema || !targetFieldSchema.items?.properties) return;

  const readOnly = readOnlyView || targetFieldSchema.readOnly;

  if (readOnly) {
    return <SchemaArrayBox schema={schema} label={label} isRoot={isRoot} />;
  }

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      paddingSize={'medium'}
      flush={false}
      action={
        hasToolbarActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.toolbarActions} />
        ) : undefined
      }
      footerRight={
        hasBottomActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        ) : undefined
      }
      fullHeight={isLast}
    >
      <RaArrayInput source={target} label={false} defaultValue={[]}>
        <SchemaChoicesFormIterator schema={schema} source={target} inline />
      </RaArrayInput>
    </BoxLayout>
  );
};
