import React, {useMemo} from 'react';
import {
  RecordContextProvider,
  SourceContextProvider,
  SourceContextValue,
  useListContext,
  useSourceContext,
} from 'react-admin';
import {Box} from '@mui/material';
import {SchemaSimpleBox} from '@schema/components/boxes/SchemaSimpleBox';
import {BoxSchema, HabRecord} from '@schema/types';

type MultipleFieldListRowProps = {
  index: number;
  schema: BoxSchema;
};

const MultipleFieldListRow = ({index, schema}: MultipleFieldListRowProps) => {
  const parentSourceContext = useSourceContext();

  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => {
        if (!source) {
          return parentSourceContext.getSource(index.toString());
        }
        return parentSourceContext.getSource(`${index}.${source}`);
      },
      getLabel: (source: string) => parentSourceContext.getLabel(`${index}.${source}`),
    }),
    [parentSourceContext, index]
  );

  return (
    <SourceContextProvider value={sourceContext}>
      <SchemaSimpleBox schema={schema} />
    </SourceContextProvider>
  );
};

type MultipleFieldListProps = {
  schema: BoxSchema;
};

export const SchemaMultipleFieldList = ({schema}: MultipleFieldListProps) => {
  const {data} = useListContext<HabRecord>();

  // Each array item renders as a headerless nested panel holding a `PropertyList` of the row's
  // attributes. Force a padded card (`type: 'simple'`, `card: true`, no label): the array box's own
  // `type: 'array'` is full-bleed (flush), and its label belongs to the outer box, not each row.
  // Memoized so every row's `schema` prop keeps a stable identity across re-renders (a fresh object
  // per render defeats any memoization keyed on it downstream); placed before the early return
  // below since a hook can't sit after a conditional one.
  const rowSchema: BoxSchema = useMemo(
    () => ({
      ...schema,
      type: 'simple',
      card: true,
      label: undefined,
    }),
    [schema]
  );

  if (!data) return null;

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
      {data.map((record: HabRecord, index: number) => (
        <RecordContextProvider key={index} value={record}>
          <MultipleFieldListRow index={index} schema={rowSchema} />
        </RecordContextProvider>
      ))}
    </Box>
  );
};
