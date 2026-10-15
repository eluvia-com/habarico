import React, {ReactNode, createContext, useContext, useMemo} from 'react';
import {RouterProvider, createHashRouter, useInRouterContext} from 'react-router-dom';

// The router's one route renders whatever `AdminHashRouter` was last given, so the router itself is
// created once and still renders the current children.
const RouterChildrenContext = createContext<ReactNode>(null);

const RouterChildren = () => <>{useContext(RouterChildrenContext)}</>;

const StableHashRouter = ({basename, children}: AdminHashRouterProps) => {
  // Kept for the lifetime of the admin, like the one a `createHashRouter` call at module scope gives
  // an application. Not disposed on unmount: StrictMode re-runs effects on the same memoized router,
  // which a dispose in the cleanup would leave without its history listener.
  const router = useMemo(
    () => createHashRouter([{path: '*', element: <RouterChildren />}], {basename}),
    [basename]
  );

  return (
    <RouterChildrenContext.Provider value={children}>
      <RouterProvider router={router} />
    </RouterChildrenContext.Provider>
  );
};

export type AdminHashRouterProps = {
  // Prefix of every admin route inside the hash (`#/admin/products` for `/admin`).
  basename?: string;
  children: ReactNode;
};

/**
 * The hash router of an admin rendered outside any router of the application's.
 *
 * React Admin creates such a router itself when it finds none, but creates it again on every render
 * of `<AdminContext>`. A redirect issued after such a render — the one to the login page after a
 * sign-out re-scopes the store and drops the schemas — then reaches a router nothing listens to any
 * more: the URL changes and the screen does not. Rendered above `<AdminContext>`, this router is
 * created once, and React Admin uses it instead. Inside a router of the application's it renders
 * its children unchanged.
 *
 * Pass `basename` here rather than to `<AdminContext>` when this component provides the router.
 */
export const AdminHashRouter = ({basename, children}: AdminHashRouterProps) => {
  if (useInRouterContext()) {
    return <>{children}</>;
  }
  return <StableHashRouter basename={basename}>{children}</StableHashRouter>;
};
