import {PropsWithChildren} from 'react';
import {createPortal} from 'react-dom';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';

export const HeaderActionsPortal = ({children}: PropsWithChildren) => {
  const {actionsContainer} = useLayoutDynamicContext();
  if (!actionsContainer) return;
  return createPortal(children, actionsContainer);
};
