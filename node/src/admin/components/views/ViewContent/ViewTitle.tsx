import React, {ReactNode} from 'react';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {EllipsisWithTitle} from '@design/atoms/EllipsisWithTitle';
import {Box} from '@mui/material';

export type ViewTitleProps = {
  children?: ReactNode;
};

// Pure placement primitive: it portals its `children` into the presentation's title
// target (layout header on a page, `DialogTitle` in a dialog) and does nothing else.
// It intentionally does not wrap children in `DynamicText` — callers pass a ready node.
export const ViewTitle = ({children}: ViewTitleProps) => {
  const {setTitle, presentation} = useViewPresentation();
  const isInOverlay = presentation !== 'page';
  if (!children) return null;

  // Inside a modal the title lives in a flex header with limited width, so let it
  // wrap onto multiple lines instead of truncating/overflowing horizontally.
  if (isInOverlay) {
    return setTitle(<Box sx={{minWidth: 0, overflowWrap: 'anywhere'}}>{children}</Box>);
  }

  return setTitle(
    <EllipsisWithTitle
      maxWidth={{
        xs: 400,
        sm: 300,
        md: 600,
        lg: 900,
        xl: 1400,
      }}
    >
      {children}
    </EllipsisWithTitle>
  );
};
