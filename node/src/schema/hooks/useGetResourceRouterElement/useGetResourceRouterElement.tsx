import React from 'react';
import {RaRecord, Resource, ResourceProps} from 'react-admin';
import {Route} from 'react-router-dom';
import {NotFound} from '@admin/components/common/NotFound';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {
  ResourceBoxProvider as ResourceBoxProviderType,
  ResourceButtonProvider as ResourceButtonProviderType,
  ResourceFieldProvider as ResourceFieldProviderType,
  ResourceInputProvider as ResourceInputProviderType,
} from '@schema/providers/types';
import {
  getViewWithProvidersWithPageContent,
  isResourceElement,
  renderSubResourceRoutes,
  resolveView,
} from '@schema/utils/resourceRouterHelpers';
import {isRoutedViewMode} from '@schema/utils/viewMode';
import {useGetGlobalResourceSchema} from '../useGetGlobalResourceSchema';

export const useGetResourceRouterElement = () => {
  const {resources, defaultViewProvider} = useSchemaRootContext();
  const getResourceSchema = useGetGlobalResourceSchema();

  const getResourceRouterElement = (resource: string) => {
    const resourceSchema = getResourceSchema(resource);
    if (!resourceSchema) return;

    const resourceElement = resources[resource];

    if (resourceElement && isResourceElement(resourceElement)) {
      return <Resource {...resourceElement.props} />;
    } else {
      const createViewSchema = resourceSchema.views.find((view) => view.name === 'create');
      const editViewSchema = resourceSchema.views.find((view) => view.name === 'edit');
      const showViewSchema = resourceSchema.views.find((view) => view.name === 'show');
      const listViewSchema = resourceSchema.views.find((view) => view.name === 'list');

      const showViewEl = defaultViewProvider({type: 'show'});
      const editViewEl = defaultViewProvider({type: 'edit'});
      const createViewEl = defaultViewProvider({type: 'create'});
      const listViewEl = defaultViewProvider({type: 'list'});

      const resourceElementProps = (resourceElement?.props || {}) as ResourceProps & {
        inputProvider?: ResourceInputProviderType;
        fieldProvider?: ResourceFieldProviderType;
        boxProvider?: ResourceBoxProviderType;
        buttonProvider?: ResourceButtonProviderType;
      };

      const {
        list = resolveView(listViewSchema, listViewEl),
        create = resolveView(createViewSchema, createViewEl),
        edit = resolveView(editViewSchema, editViewEl),
        show = resolveView(showViewSchema, showViewEl),
        options = {label: resourceSchema.label},
        // icon = getIconIfExists(resourceSchema.menu?.icon),
        recordRepresentation = (record: RaRecord) => record['meta']['repr'],
        inputProvider,
        fieldProvider,
        boxProvider,
        buttonProvider,
        name = resource,
        ...rest
      } = resourceElementProps;

      // Only inline (redirect / no mode) action views get a router path; modal/sidepanel
      // action views are opened from a trigger and must not register a route.
      const actionViews = resourceSchema.views.filter(
        (view) => view.type === 'action' && isRoutedViewMode(view.mode)
      );
      const detailActionViews = actionViews.filter((view) => view.isDetail);
      const listActionViews = actionViews.filter((view) => !view.isDetail);

      const subResourceEl = defaultViewProvider({resource, type: 'subresource'});

      return (
        <Resource
          name={name}
          list={getViewWithProvidersWithPageContent({
            view: React.isValidElement(list) ? list : undefined,
            inputProvider,
            fieldProvider,
            boxProvider,
            buttonProvider,
          })}
          create={getViewWithProvidersWithPageContent({
            view: React.isValidElement(create) ? create : undefined,
            inputProvider,
            fieldProvider,
            boxProvider,
            buttonProvider,
          })}
          edit={getViewWithProvidersWithPageContent({
            view: React.isValidElement(edit) ? edit : undefined,
            inputProvider,
            fieldProvider,
            boxProvider,
            buttonProvider,
          })}
          show={getViewWithProvidersWithPageContent({
            view: React.isValidElement(show) ? show : undefined,
            inputProvider,
            fieldProvider,
            boxProvider,
            buttonProvider,
          })}
          key={resource}
          options={options}
          recordRepresentation={recordRepresentation}
          {...rest}
        >
          {listActionViews.map((view) => {
            const routerEl = defaultViewProvider({
              resource,
              type: view.type,
              name: view.name,
              actionName: view.endpoint.reference?.actionName,
              router: true,
            });
            if (!routerEl) return null;

            return (
              <Route path={`a/${view.name}/*`} element={routerEl} key={`detail-${view.name}`} />
            );
          })}
          {detailActionViews.map((view) => {
            const routerEl = defaultViewProvider({
              resource,
              type: view.type,
              name: view.name,
              actionName: view.endpoint.reference?.actionName,
              router: true,
            });
            if (!routerEl) return null;
            return (
              <Route path={`:id/a/${view.name}/*`} element={routerEl} key={`list-${view.name}`} />
            );
          })}
          {renderSubResourceRoutes(subResourceEl)}
          <Route path="*" element={<NotFound />} />
        </Resource>
      );
    }
  };
  return getResourceRouterElement;
};
