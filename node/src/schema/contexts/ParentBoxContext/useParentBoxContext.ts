import {useCallback, useContext} from 'react';
import {ParentBoxContext} from './ParentBoxContext';

export const useParentBoxContext = () => {
  const context = useContext(ParentBoxContext);

  const parentBoxName = context?.parentBoxName;
  const getBoxName = useCallback(
    (name: string) => {
      if (parentBoxName === undefined) return name;
      if (name === '') return parentBoxName;
      return parentBoxName + '.' + name;
    },
    [parentBoxName]
  );

  if (context === undefined) {
    return {
      parentBoxSchema: undefined,
      parentBoxName: undefined,
      isHidden: false,
      getBoxName,
    };
  }

  return {
    getBoxName,
    ...context,
  };
};
