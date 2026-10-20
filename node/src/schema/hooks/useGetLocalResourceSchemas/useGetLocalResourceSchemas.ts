import {useCallback, useMemo} from 'react';
import {useLocalResourceSchemaQueryOptions} from '@schema/hooks/useGetLocalResourceSchema/useLocalResourceSchemaQueryOptions';
import {LocalResourceSchema, ResourceReference} from '@schema/types';
import {referenceKey, resourceKey} from '@schema/utils/resourceReference';
import {UseQueryResult, useQueries} from '@tanstack/react-query';

/** One schema of the lookup; `schema` stays unset while loading or on failure. */
export type LocalResourceSchemaResult = {
  schema?: LocalResourceSchema;
  isLoading: boolean;
  isError: boolean;
};

type UseGetLocalResourceSchemasProps = {
  references: ResourceReference[];
};

const NOT_REQUESTED: LocalResourceSchemaResult = {isLoading: false, isError: false};

// module-level so the combined result keeps its identity while the queries do not change
const toResults = (results: UseQueryResult<LocalResourceSchema>[]): LocalResourceSchemaResult[] =>
  results.map(({data, isLoading, isError}) => ({schema: data, isLoading, isError}));

/**
 * Loads the schema of every reference — one query per distinct reference, shared with
 * `useGetLocalResourceSchema` and every other reader of that schema — and looks each one up.
 */
export const useGetLocalResourceSchemas = ({references}: UseGetLocalResourceSchemasProps) => {
  const queryOptions = useLocalResourceSchemaQueryOptions();
  const options = useMemo(
    () =>
      references.map((reference) =>
        queryOptions({
          resource: resourceKey(reference),
          recordId: reference.recordPk,
          actionName: reference.actionName,
          params: reference.params,
        })
      ),
    [references, queryOptions]
  );

  const results = useQueries({
    queries: options.map(({query}) => query),
    combine: toResults,
  });

  const byReference = useMemo(
    () =>
      new Map<string, LocalResourceSchemaResult>(
        references.map((reference, index) => {
          const {isUnknown} = options[index];
          const {schema, isLoading, isError} = results[index] ?? {isLoading: true, isError: false};
          return [
            referenceKey(reference),
            {schema, isLoading: isLoading && !isUnknown, isError: isError || isUnknown},
          ];
        })
      ),
    [references, options, results]
  );

  return useCallback(
    (reference: ResourceReference) => byReference.get(referenceKey(reference)) ?? NOT_REQUESTED,
    [byReference]
  );
};
