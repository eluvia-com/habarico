import {BoxSchema} from '@schema/types';

export type ParentBoxContextType = {
  parentBoxName: string;
  parentBoxSchema: BoxSchema;
  isHidden: boolean;
};
