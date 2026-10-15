import {DataType} from '@typing';

export type DynamicDataType = {
  data: DataType;
  record: DataType;
  formData?: DataType;
  parent?: DynamicDataType;
};

export type DynamicViewDataType = DynamicDataType & {
  viewData: DataType | undefined;
};
