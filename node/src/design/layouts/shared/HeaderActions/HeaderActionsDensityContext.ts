import {createContext, useContext} from 'react';
import {HeaderActionsDensity} from './headerActionsDensity';

/**
 * The density the header asks its actions to render at. Provided by a layout that measures its
 * header row (`DashboardLayout`); `undefined` outside one, where actions keep their own
 * viewport-based behaviour.
 */
export const HeaderActionsDensityContext = createContext<HeaderActionsDensity | undefined>(
  undefined
);

/**
 * Reads how compactly the header wants the current view's actions — `full`, `iconOnly` or `menu`.
 * Whatever renders into the header actions slot ({@link HeaderActionsPortal}) should follow it: the
 * layout compacts the actions when a long breadcrumb trail would otherwise be squeezed out, and
 * expands them again once there is room. Returns `undefined` outside a measuring layout.
 */
export const useHeaderActionsDensity = (): HeaderActionsDensity | undefined =>
  useContext(HeaderActionsDensityContext);
