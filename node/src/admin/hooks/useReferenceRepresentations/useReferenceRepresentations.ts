import {useMemo} from 'react';
import {useGetMany, useGetRecordRepresentation, useLocaleState} from 'react-admin';
import {useResourceContextOrUndefined} from '@admin/contexts/ResourceContext';

// Resolves foreign-key ids to their record representation by fetching the referenced records
// and applying the resource's recordRepresentation (set to record.meta.repr by default, but
// respects any consumer override on SchemaResource). Returns a map of raw id → repr string;
// ids without a fetched record fall back to the id string. Pass `reference` undefined (or no
// ids) to disable the fetch — keeps the hook safe to call unconditionally.
export const useReferenceRepresentations = (
  reference: string | undefined,
  ids: Array<string | number>
): Map<string, string> => {
  const uniqueIds = useMemo(() => Array.from(new Set(ids.map(String))), [ids]);
  const resolved = useResourceContextOrUndefined(reference);
  const referenceResource = reference ? resolved : undefined;

  const [locale] = useLocaleState();

  const {data} = useGetMany(
    referenceResource ?? '',
    {ids: uniqueIds, meta: {locale}},
    {enabled: !!referenceResource && uniqueIds.length > 0}
  );

  const getRepresentation = useGetRecordRepresentation(referenceResource);

  return useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach((record) => {
      const repr = getRepresentation(record);
      map.set(String(record.id), typeof repr === 'string' ? repr : String(record.id));
    });
    return map;
  }, [data, getRepresentation]);
};
