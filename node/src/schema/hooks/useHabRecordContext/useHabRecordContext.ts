import {UseRecordContextParams, useRecordContext as raUseRecordContext} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {HabRecord} from '@schema/types';
import {resourceOfKey} from '@schema/utils/resourceReference';

export const useHabRecordContext = (params?: UseRecordContextParams<HabRecord>) => {
  const record = raUseRecordContext<HabRecord>(params);
  const currentResource = useResourceContext();

  // React Admin's record context holds whatever was put in it, so the `HabRecord` above is an
  // unchecked cast: a record without `meta` is not one of ours and counts as no record at all.
  // Passing it on instead would hand consumers a `HabRecord` whose non-optional `meta` is missing.
  if (!record?.meta) return undefined;

  // `meta.schema.name` is the bare resource name of the record's own service. A record of a
  // different resource than the current context is not this context's record.
  if (resourceOfKey(currentResource) !== record.meta.schema.name) return undefined;

  return record;
};
