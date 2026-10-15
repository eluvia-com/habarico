import {UseRecordContextParams, useRecordContext as raUseRecordContext} from 'react-admin';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {HabRecord} from '@schema/types';

export const useHabRecordContext = (params?: UseRecordContextParams<HabRecord>) => {
  const record = raUseRecordContext<HabRecord>(params);
  const currentResource = useResourceContext();
  const recordResource = useResourceContext(record?.meta?.schema.name);

  if (currentResource !== recordResource) {
    // If the record is from a different resource than the current context, return undefined
    return undefined;
  }
  return record;
};
