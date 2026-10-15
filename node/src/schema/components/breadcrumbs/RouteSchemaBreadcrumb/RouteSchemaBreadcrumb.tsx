import React, {FC} from 'react';
import {ResourceContextProvider, useResourceDefinition, useTranslate} from 'react-admin';
import {Params, matchRoutes, useLocation, useParams} from 'react-router-dom';
import {DynamicText} from '@admin/components/common/DynamicText';
import {ResourceRepresentation} from '@admin/components/common/ResourceRepresentation';
import {EllipsisWithTitle} from '@design/atoms/EllipsisWithTitle';
import {PortalBreadcrumbItem} from '@design/layouts/shared/PortalBreadcrumbs';
import {useGlobalResourceSchemaContext} from '@schema/hooks/useGlobalResourceSchemaContext';
import {MAX_BREADCRUMB_WIDTH} from '../constants';

type BreadcrumbProps = {
  location?: string;
  prefix?: string;
  nested?: boolean;
  redirect?: boolean;
  detail?: boolean;
  params?: Params<string>;
};

// --- CreateBreadcrumb ---

export const CreateBreadcrumb = (_: BreadcrumbProps) => {
  const translate = useTranslate();
  return (
    <PortalBreadcrumbItem>
      <EllipsisWithTitle maxWidth={MAX_BREADCRUMB_WIDTH}>
        <DynamicText>{translate('ra.action.create')}</DynamicText>
      </EllipsisWithTitle>
    </PortalBreadcrumbItem>
  );
};

// --- NestedBreadcrumb ---

export const NestedBreadcrumb = ({prefix = '', location}: BreadcrumbProps) => {
  const {target} = useParams();
  return (
    <RouteSchemaBreadcrumb prefix={`${prefix}/n/${target}`} rootRouter={true} location={location} />
  );
};

// --- RedirectBreadcrumb ---

export const RedirectBreadcrumb = ({prefix = '', location}: BreadcrumbProps) => {
  return <RouteSchemaBreadcrumb prefix={`${prefix}/r`} rootRouter={true} location={location} />;
};

// --- ListBreadcrumb ---

export const ListBreadcrumb = ({
  prefix = '',
  nested = false,
  redirect = false,
  detail = false,
  location,
  params = {},
}: BreadcrumbProps) => {
  const {serviceName, schemaName} = params;

  const path = `${prefix}/${serviceName}/${schemaName}`;

  const resource = `${serviceName}/${schemaName}`;
  const {schema: resourceSchema} = useGlobalResourceSchemaContext(resource);
  const definition = useResourceDefinition({resource});

  if (!resourceSchema) return;

  const isFinal = !nested && !redirect && !detail;
  const showList = definition.hasList && (prefix === '' || isFinal);

  return (
    <ResourceContextProvider value={resource}>
      <>
        {showList && (
          <PortalBreadcrumbItem path={!isFinal ? path : undefined}>
            <EllipsisWithTitle maxWidth={MAX_BREADCRUMB_WIDTH}>
              {definition.options?.label}
            </EllipsisWithTitle>
          </PortalBreadcrumbItem>
        )}
        {nested && <NestedBreadcrumb prefix={path} location={location} />}
        {redirect && <RedirectBreadcrumb prefix={path} location={location} />}
        {detail && <RouteSchemaBreadcrumb prefix={path} location={location} />}
      </>
    </ResourceContextProvider>
  );
};

// --- EditBreadcrumb ---

export const EditBreadcrumb = ({
  prefix = '/',
  nested = false,
  redirect = false,
  params = {},
  location,
}: BreadcrumbProps) => {
  const {id} = params;

  const path = `${prefix}/${id}`;

  const isFinal = !nested && !redirect;

  return (
    <>
      <PortalBreadcrumbItem path={!isFinal ? path : undefined}>
        <ResourceRepresentation id={id} maxWidth={MAX_BREADCRUMB_WIDTH} />
      </PortalBreadcrumbItem>
      {nested && <NestedBreadcrumb prefix={path} location={location} />}
      {redirect && <RedirectBreadcrumb prefix={path} location={location} />}
    </>
  );
};

// --- ShowBreadcrumb ---

export const ShowBreadcrumb = ({
  prefix = '/',
  nested = false,
  redirect = false,
  params = {},
  location,
}: BreadcrumbProps) => {
  const {id} = params;

  const path = `${prefix}/${id}/show`;

  const isFinal = !nested && !redirect;

  return (
    <>
      <PortalBreadcrumbItem path={!isFinal ? path : undefined}>
        <ResourceRepresentation id={id} maxWidth={MAX_BREADCRUMB_WIDTH} />
      </PortalBreadcrumbItem>
      {nested && <NestedBreadcrumb prefix={path} location={location} />}
      {redirect && <RedirectBreadcrumb prefix={path} location={location} />}
    </>
  );
};

// --- RouteSchemaBreadcrumb ---

type RouteSchemaBreadcrumbProps = BreadcrumbProps & {
  rootRouter?: boolean;
};

type RouteType = {
  path: string;
  component: FC<BreadcrumbProps>;
  props?: {
    nested?: boolean;
    redirect?: boolean;
    detail?: boolean;
  };
};

const rootRoutes: RouteType[] = [
  {
    path: ':serviceName/:schemaName',
    component: ListBreadcrumb,
  },
  {
    path: ':serviceName/:schemaName/n/:target/*',
    component: ListBreadcrumb,
    props: {nested: true},
  },
  {
    path: ':serviceName/:schemaName/r/*',
    component: ListBreadcrumb,
    props: {redirect: true},
  },
  {
    path: ':serviceName/:schemaName/*',
    component: ListBreadcrumb,
    props: {detail: true},
  },
];

const routes: RouteType[] = [
  {
    path: 'create',
    component: CreateBreadcrumb,
  },
  {
    path: ':id/show/r/*',
    component: ShowBreadcrumb,
    props: {redirect: true},
  },
  {
    path: ':id/show/n/:target/*',
    component: ShowBreadcrumb,
    props: {nested: true},
  },
  {
    path: ':id/show',
    component: ShowBreadcrumb,
  },
  {
    path: ':id/n/:target/*',
    component: EditBreadcrumb,
    props: {nested: true},
  },
  {
    path: ':id/r/*',
    component: EditBreadcrumb,
    props: {redirect: true},
  },
  {
    path: ':id',
    component: EditBreadcrumb,
  },
  {
    path: ':id/*',
    component: EditBreadcrumb,
  },
];

export const RouteSchemaBreadcrumb = ({
  prefix,
  rootRouter = !prefix,
  location,
}: RouteSchemaBreadcrumbProps) => {
  const urlLocation = useLocation();
  const matches = matchRoutes(rootRouter ? rootRoutes : routes, location || urlLocation);

  if (!matches) return null;

  const matchedRoute = matches[0];

  if (!matchedRoute) return null;

  const route = matchedRoute.route as RouteType;
  const Component = route.component;

  const nextLocation = matchedRoute.params['*'];

  return (
    <Component
      location={nextLocation ? `/${nextLocation}` : undefined}
      params={matchedRoute.params}
      prefix={prefix}
      {...(route.props || {})}
    />
  );
};
