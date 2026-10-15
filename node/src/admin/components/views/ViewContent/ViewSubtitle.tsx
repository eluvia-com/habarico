import {ReactNode} from 'react';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';

export type ViewSubtitleProps = {
  children?: ReactNode;
};

// Pure placement primitive: portals its `children` into the presentation's subtitle target (the
// `CustomDialogTitle` subtitle slot in a dialog). On a page `setSubtitle` returns `undefined`, so the
// subtitle renders nothing — the surface has no subtitle slot yet.
export const ViewSubtitle = ({children}: ViewSubtitleProps) => {
  const {setSubtitle} = useViewPresentation();
  if (!children) return null;
  return setSubtitle(children);
};
