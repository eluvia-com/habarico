import React from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {MenuSchemaBreadcrumb} from '../MenuSchemaBreadcrumb';
import {RouteSchemaBreadcrumb} from '../RouteSchemaBreadcrumb';

export const ViewSchemaBreadcrumbs = () => {
  const {viewSchema} = useViewSchemaContext();

  return viewSchema.breadcrumbs ? (
    viewSchema.breadcrumbs.map((breadcrumb, index) => {
      return <MenuSchemaBreadcrumb key={index} menuSchema={breadcrumb} />;
    })
  ) : (
    <RouteSchemaBreadcrumb />
  );
};
