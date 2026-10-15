import {createContext, useCallback, useContext} from 'react';
import {useLocaleState} from 'react-admin';
import {FieldProps} from '@admin/components/fields/types';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {FieldFormatType, FieldSchema, FieldType} from '@schema/types';
import {ResourceFieldProviderState} from './types';

export const ResourceFieldProviderContext = createContext<ResourceFieldProviderState | undefined>(
  undefined
);

type GetFieldElementProps = {
  resource: string;
  source: string;
  type: FieldType;
  isInList?: boolean;
  format?: FieldFormatType;
  schema?: FieldSchema;
  props: FieldProps;
};

export function useGetField() {
  const {fieldProvider, defaultFieldProvider} = useSchemaRootContext();
  const [locale] = useLocaleState();

  const resourceFieldProvider = useContext(ResourceFieldProviderContext);

  return useCallback(
    ({resource, source, type, isInList, format, schema, props}: GetFieldElementProps) => {
      if (resourceFieldProvider) {
        const fieldWithProps = resourceFieldProvider({
          source,
          type,
          isInList,
          format,
          schema,
          locale,
          props,
        });
        if (fieldWithProps === null) return;
        if (fieldWithProps) return fieldWithProps;
      }

      if (fieldProvider) {
        const fieldWithProps = fieldProvider({
          resource,
          source,
          type,
          isInList,
          format,
          schema,
          locale,
          props,
        });
        if (fieldWithProps === null) return;
        if (fieldWithProps) return fieldWithProps;
      }
      return defaultFieldProvider({
        resource,
        source,
        type,
        isInList,
        format,
        schema,
        locale,
        props,
      });
    },
    [fieldProvider, defaultFieldProvider, locale, resourceFieldProvider]
  );
}
