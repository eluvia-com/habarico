import {useCallback} from 'react';
import {Validator} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {FieldSchema} from '@schema/types';
import {buildSchemaValidators} from '@schema/utils/schemaValidators';

/**
 * Returns a resolver that maps a field schema's `options.validators` to react-admin validators,
 * running each rule through the consumer's `validatorProvider` (if any) and falling back to the
 * `defaultValidatorProvider`. Mirrors `useGetField` / `useGetInput`: the providers come from
 * `SchemaRootContext`, so a consuming app can add or override validators app-wide.
 */
export const useSchemaValidators = (): ((schema: FieldSchema) => Validator[]) => {
  const {validatorProvider, defaultValidatorProvider} = useSchemaRootContext();
  const resource = useResourceContext();

  return useCallback(
    (schema: FieldSchema) =>
      buildSchemaValidators(schema, defaultValidatorProvider, validatorProvider, resource),
    [validatorProvider, defaultValidatorProvider, resource]
  );
};
