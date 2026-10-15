import {get} from 'lodash-es';
import React from 'react';
import {Identifier, ListContextProvider, useListContext, useRecordContext} from 'react-admin';

type OrderedListProviderProps = {
  source: string;
  children: React.ReactNode;
};

export const OrderedListProvider = ({source, children}: OrderedListProviderProps) => {
  const listContext = useListContext();
  const record = useRecordContext();
  const ids: Identifier[] = get(record, source) ?? [];

  if (!listContext.data) {
    return <ListContextProvider value={listContext}>{children}</ListContextProvider>;
  }

  const orderedData = [...listContext.data].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return (
    <ListContextProvider value={{...listContext, data: orderedData}}>
      {children}
    </ListContextProvider>
  );
};
