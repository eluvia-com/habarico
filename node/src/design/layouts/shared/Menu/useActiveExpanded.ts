import {usePathname} from '@foundation/hooks/usePathname';
import {LayoutMenuItem} from '../../types';

export const useActiveExpanded = () => {
  const pathname = usePathname();

  const isPathOrSubPath = (path: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

  const matchedPath = (item: LayoutMenuItem): string => item.activePath ?? item.href;

  const defaultIsActive = (item: LayoutMenuItem): boolean =>
    isPathOrSubPath(matchedPath(item)) && !item.items?.some((i) => isExpanded(i));

  const defaultIsExpanded = (item: LayoutMenuItem): boolean =>
    isPathOrSubPath(matchedPath(item)) || !!item.items?.some((i) => isExpanded(i));

  const isActive = (item: LayoutMenuItem): boolean => {
    return item.isActive ? item.isActive(item) : defaultIsActive(item);
  };

  const isExpanded = (item: LayoutMenuItem): boolean => {
    return item.isExpanded ? item.isExpanded(item) : defaultIsExpanded(item);
  };

  return {isActive, isExpanded};
};
