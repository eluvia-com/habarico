import {ReactElement, useCallback, useContext} from 'react';
import {IconsMap} from '@typing';
import {AdminConfigContext} from './AdminConfigContext';

// Stable empty registry so the "no admin root" / "no icons" case keeps a constant identity.
const EMPTY_ICONS: IconsMap = {};

/**
 * Reads the app icon registry from `AdminConfig` and returns a `getIcon` resolver.
 * `getIcon(source, value, iconsKey)` looks up `iconsMap[iconsKey]` and either calls it (function
 * variant) or indexes it by value; returns `undefined` when there is no matching icon.
 *
 * Reads the context defensively (not via the throwing `useAdminConfig`) so a field/input rendered
 * in isolation — outside an admin root — still resolves to "no icon" instead of crashing.
 */
export const useIcons = () => {
  const iconsMap = useContext(AdminConfigContext)?.iconsMap ?? EMPTY_ICONS;

  const getIcon = useCallback(
    (source: string, value: string | number, iconsKey?: string): ReactElement | undefined => {
      if (iconsKey && iconsKey in iconsMap) {
        const iconsValueMap = iconsMap[iconsKey];
        return typeof iconsValueMap === 'function'
          ? iconsValueMap(source, value)
          : iconsValueMap[value];
      }
    },
    [iconsMap]
  );

  return {iconsMap, getIcon};
};
