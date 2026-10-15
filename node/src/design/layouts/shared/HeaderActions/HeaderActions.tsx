import React, {useEffect, useRef} from 'react';
import {Box} from '@mui/material';
import {useLayoutDynamicContext} from '../../contexts/LayoutDynamicContext';

/**
 * Portal target for the current view's global actions, rendered in the header between the
 * breadcrumbs and the search toggle. The schema layer portals its (already responsive) toolbar
 * — one or two full buttons plus an overflow `⋮` menu — into this container via
 * `LayoutDynamicContext.actionsContainer`. Purely presentational; stays out of the layout flow
 * while empty so it reserves no space when a view exposes no actions.
 */
export const HeaderActions = () => {
  const {setActionsContainer} = useLayoutDynamicContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) setActionsContainer?.(ref.current);
  }, [setActionsContainer]);

  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        '&:not(:empty)': {mr: 3},
      }}
    />
  );
};
