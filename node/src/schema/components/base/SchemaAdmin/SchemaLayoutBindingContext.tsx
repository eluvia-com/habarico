import {createContext, useContext} from 'react';
import {LayoutComponent as LayoutComponentType} from 'react-admin';
import type {SearchComponentType} from '@design/layouts/types';
import {ExtraMenuItem} from './types';

// What `SchemaLayoutWithSlots` — the component handed to `<AdminUI layout>` — needs: the layout
// shell to render and the schema-layer slots to fill it with.
//
// These travel in a context rather than in the layout component's props *closure*, and that is the
// whole point of this file: React Admin renders the `layout` prop as an element of that type, so a
// component built during render (one memoized on the slots, as this used to be) gets a new
// identity whenever a slot's reference changes — and a new element type unmounts the entire admin
// below it, open forms and their unsaved values included. An application passing `extraMenuItems`
// inline, or merely re-rendering for an unrelated reason (a token refresh), lost the user's work.
//
// With the binding in a context, `SchemaLayoutWithSlots` is a module-level constant: a slot change
// re-renders the wrapper and the layout under it — the menu is rebuilt, the admin is not.
export type SchemaLayoutBinding = {
  // The layout shell itself. Also carried here, not closed over, so the wrapper's identity does not
  // depend on it either.
  LayoutComponent: LayoutComponentType;
  // Custom top-level items merged into the schema-generated menu by `useSchemaMenu`.
  extraMenuItems?: ExtraMenuItem[];
  // Renders the global search overlay's contents; the library ships no such component.
  search?: SearchComponentType;
};

export const SchemaLayoutBindingContext = createContext<SchemaLayoutBinding | undefined>(undefined);

export const useSchemaLayoutBinding = () => {
  const context = useContext(SchemaLayoutBindingContext);
  if (context === undefined)
    throw new Error('SchemaLayoutBindingContext was used outside SchemaAdminRuntime');
  return context;
};
