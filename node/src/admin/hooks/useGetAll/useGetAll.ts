import {useMemo} from 'react';
import {RaRecord, SortPayload, useDataProvider} from 'react-admin';
import {UseQueryOptions, UseQueryResult, useQuery} from '@tanstack/react-query';
import {DataType} from '@typing';

export type GetAllListParams = {
  sort: SortPayload;
  filter: DataType;
  perPage?: number;
  meta?: DataType;
};

export type GetAllResult<RecordType extends RaRecord = RaRecord> = {
  data: RecordType[];
  total?: number;
};

export const useGetAll = <RecordType extends RaRecord = RaRecord>(
  resource: string,
  params: Partial<GetAllListParams> = {},
  options?: UseQueryOptions<GetAllResult<RecordType>, Error>
) => {
  const {sort = {field: 'id', order: 'DESC'}, filter = {}, perPage = params.perPage || 50} = params;

  const dataProvider = useDataProvider();

  const fetchAll = async () => {
    let isComplete = false;
    let page = 1;
    let allData: RecordType[] = [];
    while (!isComplete) {
      const {data, total} = await dataProvider.getList<RecordType>(resource, {
        pagination: {page, perPage},
        sort,
        filter,
        meta: params.meta,
      });
      allData = [...allData, ...data];
      if (data.length === 0 || (total && allData.length >= total)) {
        isComplete = true;
      }
      page++;
    }
    return {data: allData, total: allData.length};
  };

  const result = useQuery<GetAllResult<RecordType>, Error, GetAllResult<RecordType>>({
    queryKey: [resource, 'getAll', {sort, filter, perPage}],
    queryFn: fetchAll,
    ...options,
  });

  return useMemo(
    () =>
      result.data
        ? {
            ...result,
            data: result.data?.data,
            total: result.data?.total,
          }
        : result,
    [result]
  ) as unknown as UseQueryResult<RecordType[]> & {
    total?: number;
  };
};
