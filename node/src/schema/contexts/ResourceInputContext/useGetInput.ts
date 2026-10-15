import {createContext, useContext} from 'react';
import {useLocaleState} from 'react-admin';
import {InputProps} from '@admin/components/inputs/types';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {FieldFormatType, FieldSchema, FieldType} from '@schema/types';
import {ResourceInputProviderState} from './types';

export const ResourceInputProviderContext = createContext<ResourceInputProviderState | undefined>(
  undefined
);

type GetInputElementProps = {
  resource: string;
  source: string;
  type: FieldType;
  format?: FieldFormatType;
  schema?: FieldSchema;
  props: InputProps;
  isFilter?: boolean;
};

export function useGetInput() {
  const {inputProvider, defaultInputProvider} = useSchemaRootContext();
  const resourceInputProvider = useContext(ResourceInputProviderContext);
  const [locale] = useLocaleState();

  // Return contract:
  // - a ReactElement when an input is resolved,
  // - `null` when a provider explicitly returned null (input deliberately disabled),
  // - `undefined` when no input could be resolved at all (missing / unsupported).
  return ({resource, source, type, format, schema, props, isFilter}: GetInputElementProps) => {
    if (resourceInputProvider) {
      const inputWithProps = resourceInputProvider({
        source,
        type,
        format,
        schema,
        locale,
        props,
        isFilter,
      });
      if (inputWithProps === null) return null;
      if (inputWithProps) return inputWithProps;
    }
    if (inputProvider) {
      const inputWithProps = inputProvider({
        resource,
        source,
        type,
        format,
        schema,
        locale,
        props,
        isFilter,
      });
      if (inputWithProps === null) return null;
      if (inputWithProps) return inputWithProps;
    }
    return defaultInputProvider({resource, source, type, format, schema, locale, props, isFilter});
  };
}
