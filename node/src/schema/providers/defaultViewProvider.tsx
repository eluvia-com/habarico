import React from 'react';
import {SchemaSubResource} from '@schema/components/base/SchemaSubResource';
import {SchemaAction} from '@schema/components/views/SchemaAction';
import {SchemaCreate} from '@schema/components/views/SchemaCreate';
import {SchemaEdit} from '@schema/components/views/SchemaEdit';
import {SchemaList} from '@schema/components/views/SchemaList';
import {SchemaShow} from '@schema/components/views/SchemaShow';
import {SchemaViewRouter} from '@schema/components/views/SchemaViewRouter';
import {AdminViewProviderProps} from '@schema/providers/types';

export const defaultViewProvider = ({
  resource,
  name,
  actionName,
  type,
  router,
}: AdminViewProviderProps) => {
  if (router) {
    if (!resource) {
      console.warn('Resource is required for router view type');
      return null;
    }
    if (type === 'subresource') {
      console.warn('Subresource view type is not supported for router');
      return null;
    }
    if (!name) {
      console.warn('Name is required for router view type');
      return null;
    }
    return (
      <SchemaViewRouter
        resource={resource}
        viewType={type}
        viewName={name}
        actionName={actionName}
      />
    );
  }
  switch (type) {
    case 'list':
      return <SchemaList name={name} />;
    case 'show':
      return <SchemaShow name={name} />;
    case 'edit':
      return <SchemaEdit name={name} />;
    case 'create':
      return <SchemaCreate name={name} />;
    case 'action':
      return <SchemaAction name={name} actionName={actionName} />;
    case 'subresource':
      return <SchemaSubResource />;
  }
};
