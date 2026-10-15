import {useMemo} from 'react';
import {SortPayload, useGetRecordRepresentation} from 'react-admin';
import {useGetAll} from '@admin/hooks/useGetAll';
import type {TreeChoice, TreeItemId} from '@design/molecules/TreeSelect';

export type UseTreeChoicesOptions = {
  /** Record field pointing at the parent record; builds the hierarchy. Defaults to `'parent'`. */
  parent?: string;
  sort?: SortPayload;
};

/**
 * Fetches every record of `resource` and maps them into the design `TreeChoice[]` the `TreeSelect`
 * consumes: `id`, the resolved record representation as `name`, and the `parent` field as `parentId`.
 * This is the shared data half of the two tree bindings — `TreeArrayInput` (write) and `TreeArrayField`
 * (read) render `TreeSelect` from these choices, and the schema wrappers call it once, outside any
 * React Admin reference context. Loading stays with the caller (it renders the spinner).
 */
export const useTreeChoices = (
  resource: string,
  {parent = 'parent', sort}: UseTreeChoicesOptions = {}
): {choices: TreeChoice[]; isLoading: boolean} => {
  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const {data, isLoading} = useGetAll(resource, {sort, perPage: 50});

  const choices = useMemo<TreeChoice[]>(
    () =>
      (data ?? []).map((record) => ({
        id: record.id,
        name: String(getRecordRepresentation(record) ?? ''),
        parentId: record[parent] as TreeItemId | undefined,
      })),
    [data, getRecordRepresentation, parent]
  );

  return {choices, isLoading};
};
