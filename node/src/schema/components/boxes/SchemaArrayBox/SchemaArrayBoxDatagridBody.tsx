import React, {useMemo} from 'react';
import {
  DatagridBody,
  DatagridBodyProps,
  DatagridRow,
  DatagridRowProps,
  SourceContextProvider,
  SourceContextValue,
  useSourceContext,
} from 'react-admin';

const SchemaArrayBoxDatagridRow = (props: DatagridRowProps) => {
  const {id} = props;
  // ID of the row is in the format "row<index>", we need to extract the index
  const index = id?.toString().slice(3) || '0';

  const parentSourceContext = useSourceContext();

  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => {
        if (!source) {
          return parentSourceContext.getSource(index);
        }
        return parentSourceContext.getSource(`${index}.${source}`);
      },
      getLabel: (source: string) => parentSourceContext.getLabel(`${index}.${source}`),
    }),
    [parentSourceContext, index]
  );

  return (
    <SourceContextProvider value={sourceContext}>
      <DatagridRow {...props} />
    </SourceContextProvider>
  );
};

export const SchemaArrayBoxDatagridBody = (props: DatagridBodyProps) => {
  return <DatagridBody {...props} row={<SchemaArrayBoxDatagridRow />} />;
};
