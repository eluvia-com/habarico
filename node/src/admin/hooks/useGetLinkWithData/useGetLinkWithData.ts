import {useCallback} from 'react';
import {Identifier, useBasename, useResourceContext as useRaResourceContext} from 'react-admin';
import {useLocation} from 'react-router-dom';
import {useResourceContextOrUndefined} from '@admin/contexts/ResourceContext';
import {useCreateHabPath} from '@admin/hooks/useCreateHabPath';
import {ReservedViewType} from '@admin/types';

type GetLinkWithDataProps = {
  type: ReservedViewType | 'action' | 'prev';
  resource?: string;
  actionName?: string;
  id?: Identifier;
  target?: string;
  keepLinkedParent?: boolean;
  params?: Record<string, string>;
  pathname?: string;
};

export const useGetLinkWithData = (resource?: string) => {
  const currentResource = useRaResourceContext();
  const linkTargetResource = useResourceContextOrUndefined(resource);

  const createPath = useCreateHabPath();
  const basename = useBasename();
  const {pathname: currentPathname} = useLocation();

  return useCallback(
    ({
      type,
      resource,
      actionName,
      id,
      target,
      keepLinkedParent,
      params,
      pathname,
    }: GetLinkWithDataProps) => {
      const targetResource = resource || linkTargetResource;

      // All path composition below is done relative to the basename; it is re-applied
      // once at the end. Both the current pathname and createPath() already include the
      // basename, so without this the basename would be duplicated in nested links.
      const stripBasename = (p: string) =>
        basename && (p === basename || p.startsWith(`${basename}/`)) ? p.slice(basename.length) : p;

      let path = pathname === undefined ? currentPathname : pathname;
      path = stripBasename(path);
      if (path.startsWith('/')) {
        path = path.slice(1);
      }

      const paths = path.split(/\/(n\/[^/]+|r)\//);

      if (type === 'prev') {
        if (paths.length === 1) {
          return undefined;
        }
        return `${basename}/${paths.slice(0, -2).join('/')}`;
      }

      let link = stripBasename(`${createPath({type, actionName, resource: targetResource, id})}`);

      if (!target && currentResource === targetResource && ['show', 'edit'].includes(type)) {
        // `window.location.hash`, not the router's: `TabsLocationProvider` mirrors the open tabs
        // into the hash via `history.replaceState`, behind the router's back, so the router's copy
        // is stale from the first tab switch on. The window's is always current — and reading it at
        // call time (not render time) also keeps this callback from needing a location subscription
        // for it.
        link = `${link}${window.location.hash}`;
      }

      // Do not repeat resource segments in the path
      const firstSameResourcePrefixIndex = paths.findIndex((segment, index) => {
        const segmentSplit = segment.split('/');
        const segmentResource = `${segmentSplit[0]}/${segmentSplit[1]}`;
        return index % 2 === 0 && segmentResource === targetResource;
      });

      let prefix =
        firstSameResourcePrefixIndex !== -1
          ? paths.slice(0, Math.max(0, firstSameResourcePrefixIndex - 1)).join('/')
          : paths.join('/');
      if (!keepLinkedParent || firstSameResourcePrefixIndex === 0) prefix = '';

      if (prefix) {
        prefix = `/${prefix}`;
      }

      if (prefix) {
        if (target) {
          // Strip any trailing action segment (e.g. /a/edit) — subresource
          // links belong to the record, not to the view currently rendered on top of it.
          const strippedPrefix = prefix.replace(/\/a\/[^/]+$/, '');
          link = `${strippedPrefix}/n/${target}${link}`;
        } else {
          link = `${prefix}/r${link}`;
        }
      }

      // Re-apply the basename once, after all relative path composition is done.
      link = `${basename}${link}`;

      if (params) {
        link = `${link}?${new URLSearchParams(params).toString()}`;
      }
      return link;
    },
    [linkTargetResource, createPath, basename, currentPathname, currentResource]
  );
};
