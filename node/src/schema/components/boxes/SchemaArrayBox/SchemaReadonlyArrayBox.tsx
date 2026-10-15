import React, {useMemo} from 'react';
import {
  ArrayField as RaArrayField,
  SourceContextProvider,
  SourceContextValue,
  useSourceContext,
} from 'react-admin';
import {DatagridLabel} from '@admin/components/datagrid/DatagridLabel';
import {StyledDatagrid} from '@admin/components/datagrid/StyledDatagrid';
import {FieldProps} from '@admin/components/fields/types';
import {Scrollbar} from '@design/atoms/Scrollbar';
import {ValueLocationContextProvider} from '@design/contexts/ValueLocationContext';
import {Theme} from '@mui/material';
import {Box} from '@mui/material';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaFieldContent} from '@schema/components/fields/SchemaFieldContent';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {useGetField} from '@schema/contexts/ResourceFieldContext/useGetField';
import {FieldSchema} from '@schema/types';
import {getTopLevelFieldDescriptors} from '@schema/utils/api';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';
import {SchemaArrayBoxDatagridBody} from './SchemaArrayBoxDatagridBody';
import {SchemaMultipleFieldList} from './SchemaMultipleFieldList';

// Layout-only wrapper styling for the inline array box. The datagrid's own look — the neutral header
// band, the hover tint + accent stripe, cell rhythm and row borders — now comes from the shared
// `StyledDatagrid` skin, so this only caps the scroll height and centers the empty-list message.
const arrayBoxLayoutSx = (theme: Theme) => ({
  '& .mnl__scrollbar__root': {
    maxHeight: '70vh', // adjust based on your layout
  },

  // empty list message
  '.MuiCardContent-root > .MuiTypography-root': {
    textAlign: 'center',
    py: 2,
    backgroundColor: theme.palette.background.paper,
  },
});

type SchemaReadonlyArrayBoxProps = SchemaBoxProps & {
  targetFieldSchema: FieldSchema;
};

export const SchemaReadonlyArrayBox = ({schema}: SchemaReadonlyArrayBoxProps) => {
  const arrayProperties = schema.array!;
  const target = arrayProperties.target;
  const getFieldEl = useGetField();

  const fieldSchemas = useFieldSchemaMapContext();
  // Memoized like the writeable variant: a fresh map per render means fresh field-schema objects
  // for every column/cell below, defeating any memoization keyed on their identity.
  const fieldSchemaMap = useMemo(
    () => generateFieldSchemaMap(Object.values(fieldSchemas), getTopLevelFieldDescriptors(schema)),
    [fieldSchemas, schema]
  );
  const parentSourceContext = useSourceContext();

  const displayInline = arrayProperties.inline || false;

  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => {
        if (!source) {
          return parentSourceContext.getSource(target);
        }
        return parentSourceContext.getSource(`${target}.${source}`);
      },
      getLabel: (source: string) => parentSourceContext.getLabel(`${target}.${source}`),
    }),
    [parentSourceContext, target]
  );

  return (
    <RaArrayField source={target}>
      {displayInline ? (
        <ValueLocationContextProvider value={{isInCollection: true}}>
          <Box sx={arrayBoxLayoutSx}>
            <Scrollbar>
              <StyledDatagrid
                bulkActionButtons={false}
                rowClick={false}
                body={<SchemaArrayBoxDatagridBody />}
              >
                {Object.values(fieldSchemaMap).map((fieldSchema) => {
                  const fieldProps: FieldProps = {
                    source: fieldSchema.name,
                    label: (
                      <DatagridLabel
                        label={fieldSchema.label}
                        shortLabel={fieldSchema.shortLabel}
                      />
                    ),
                    sortable: fieldSchema.sortable,
                    sortBy: fieldSchema.sortBy,
                    emptyText: '--',
                  };
                  const fieldEl = getFieldEl({
                    resource: target,
                    source: fieldSchema.name,
                    type: fieldSchema.type,
                    isInList: true,
                    format: fieldSchema.format,
                    schema: fieldSchema,
                    props: fieldProps,
                  });

                  if (!fieldEl) return;

                  return (
                    <SchemaFieldContent
                      schema={fieldSchema}
                      key={`${fieldSchema.name}-${fieldSchema.targetSource}`}
                      label={fieldProps.label}
                      showLabel={false}
                      source={fieldSchema.name}
                      sortable={fieldProps.sortable}
                      sortBy={fieldProps.sortBy}
                      textAlign={fieldEl.props.textAlign}
                    >
                      {fieldEl}
                    </SchemaFieldContent>
                  );
                })}
              </StyledDatagrid>
            </Scrollbar>
          </Box>
        </ValueLocationContextProvider>
      ) : (
        <SourceContextProvider value={sourceContext}>
          <SchemaMultipleFieldList
            schema={{
              ...schema,
              label: undefined,
            }}
          />{' '}
        </SourceContextProvider>
      )}
    </RaArrayField>
  );
};
