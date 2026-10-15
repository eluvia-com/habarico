import {ReactNode} from 'react';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';

export type ViewActionsProps = {
  children?: ReactNode;
};

export const ViewActions = ({children}: ViewActionsProps) => {
  const {setActions} = useViewPresentation();
  if (!children) return null;
  return setActions(children);
};
