import {createContext, useContext} from 'react';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {BoxSchema} from '@schema/types';
import {ResourceBoxProviderState} from './types';

export const ResourceBoxProviderContext = createContext<ResourceBoxProviderState | undefined>(
  undefined
);

type GetBoxElementProps = {
  resource: string;
  schema: BoxSchema;
  excludeFields?: string[];
  props: SchemaBoxProps;
};

export function useGetBox() {
  const {boxProvider, defaultBoxProvider} = useSchemaRootContext();
  const resourceBoxProvider = useContext(ResourceBoxProviderContext);

  return ({resource, schema, excludeFields, props}: GetBoxElementProps) => {
    if (resourceBoxProvider) {
      const boxWithProps = resourceBoxProvider({schema, excludeFields, props});
      if (boxWithProps === null) return;
      if (boxWithProps) return boxWithProps;
    }

    if (boxProvider) {
      const boxWithProps = boxProvider({resource, schema, excludeFields, props});
      if (boxWithProps === null) return;
      if (boxWithProps) return boxWithProps;
    }
    return defaultBoxProvider({resource, schema, excludeFields, props});
  };
}
