import {useContext} from 'react';
import {SidePanelContext} from './SidePanelContext';
import {SidePanelController} from './types';

// Returns the docked side panel controller, or undefined when no SidePanelProvider is
// mounted (e.g. a sidepanel trigger outside a list). Callers use the absence to fall back
// to a modal presentation. `TView` types the opaque payload for the calling ring.
export const useSidePanelController = <TView = unknown,>() =>
  useContext(SidePanelContext) as SidePanelController<TView> | undefined;
