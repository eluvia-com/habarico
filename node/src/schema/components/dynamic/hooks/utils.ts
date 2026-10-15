import {get} from 'lodash-es';
import {DataType} from '@typing';
import {DynamicDataType} from './types';

type GetDataTreeParams = {
  source: string;
  rootRecord?: DataType;
  formData?: DataType;
  record?: DataType;
  viewData?: DataType;
};

export const getDataTree = ({
  source,
  rootRecord,
  formData,
  record,
  viewData,
}: GetDataTreeParams): DynamicDataType => {
  const sourceRecord = source ? get(rootRecord, source) : rootRecord;
  const sourceFormData = source && formData ? get(formData, source) : formData;

  const parentSource =
    source && source.includes('.') ? source.split('.').slice(0, -1).join('.') : '';

  const parent = source ? getDataTree({source: parentSource, rootRecord, formData}) : undefined;

  return {
    data: {...(!source ? viewData : {}), ...(sourceFormData || sourceRecord || record)},
    record: sourceRecord || record,
    formData: sourceFormData,
    parent,
  };
};
