import {Identifier, RaRecord, useRecordContext} from 'react-admin';
import {useParams} from 'react-router-dom';

export function useRecordIdOrUndefined(recordId?: Identifier): Identifier | undefined {
  const contextRecord = useRecordContext<RaRecord>();
  const {id: routeId} = useParams<'id'>();
  const actualRecordId = recordId ?? contextRecord?.id ?? routeId;
  if (actualRecordId == null) return;
  return actualRecordId;
}
