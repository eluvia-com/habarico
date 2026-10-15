import {useRecordContext, useSourceContext} from 'react-admin';
import {useRootRecordContext} from '@admin/contexts/RootRecordContext/useRootRecordContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {DynamicViewDataType} from './types';
import {getDataTree} from './utils';

export const useDynamicShowData = (): DynamicViewDataType => {
  const {data: viewData} = useSchemaViewRouterContext();
  const rootRecord = useRootRecordContext();
  const record = useRecordContext();

  const {getSource} = useSourceContext();
  const source = getSource('');

  return {
    viewData,
    ...getDataTree({source, rootRecord, record, viewData}),
  };
};
