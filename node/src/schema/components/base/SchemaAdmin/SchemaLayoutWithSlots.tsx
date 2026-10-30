import React, {ComponentType} from 'react';
import {CoreLayoutProps} from 'react-admin';
import {SchemaLayoutBinding, useSchemaLayoutBinding} from './SchemaLayoutBindingContext';

/**
 * The component `SchemaAdminRuntime` hands to `<AdminUI layout>`. It renders the configured layout
 * shell (`SchemaLayout`, or the application's `LayoutComponent`) with the schema-layer slots filled
 * in, and reads all three from `SchemaLayoutBindingContext`.
 *
 * It is a module-level constant on purpose — React Admin renders `layout` as an element of that
 * type, so anything that changes this component's identity remounts the whole admin under it, open
 * forms included. Nothing here may be built during a render.
 */
export const SchemaLayoutWithSlots = (props: CoreLayoutProps) => {
  const {LayoutComponent, extraMenuItems, search} = useSchemaLayoutBinding();

  // `CoreLayoutProps` is React Admin's contract for a layout; the slots are ours on top of it.
  const Layout = LayoutComponent as ComponentType<
    CoreLayoutProps & Omit<SchemaLayoutBinding, 'LayoutComponent'>
  >;

  return <Layout {...props} extraMenuItems={extraMenuItems} search={search} />;
};
