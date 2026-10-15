import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useResourceContextOrUndefined} from '@admin/contexts/ResourceContext';
import {useGetLinkWithData} from '@admin/hooks/useGetLinkWithData';
import {EllipsisWithTitle} from '@design/atoms/EllipsisWithTitle';
import {PortalBreadcrumbItem} from '@design/layouts/shared/PortalBreadcrumbs';
import {useGetGlobalResourceSchemaContext} from '@schema/hooks/useGetGlobalResourceSchemaContext';
import {MenuSchema} from '@schema/types';
import {MAX_BREADCRUMB_WIDTH} from '../constants';

export type MenuSchemaBreadcrumbProps = {
  menuSchema: MenuSchema;
};

export const MenuSchemaBreadcrumb = ({menuSchema}: MenuSchemaBreadcrumbProps) => {
  const getGlobalResourceSchemaContext = useGetGlobalResourceSchemaContext();
  const getLink = useGetLinkWithData();
  const reference = useResourceContextOrUndefined(menuSchema.view?.endpoint?.reference);

  if (menuSchema.type === 'link') {
    return (
      <PortalBreadcrumbItem path={menuSchema.link?.url}>
        <EllipsisWithTitle maxWidth={MAX_BREADCRUMB_WIDTH}>
          <DynamicText>{menuSchema.label}</DynamicText>
        </EllipsisWithTitle>
      </PortalBreadcrumbItem>
    );
  }
  if (menuSchema.type === 'view' && reference && menuSchema.view?.name) {
    const {getGlobalViewSchema} = getGlobalResourceSchemaContext(reference);
    const viewSchema = getGlobalViewSchema(menuSchema.view.name);

    if (viewSchema) {
      return (
        <PortalBreadcrumbItem
          path={getLink({
            type: viewSchema.type,
            resource: reference,
            actionName: menuSchema.view?.endpoint?.actionName,
            id: menuSchema.view?.endpoint?.recordPk,
          })}
        >
          <EllipsisWithTitle maxWidth={MAX_BREADCRUMB_WIDTH}>
            <DynamicText>{menuSchema.label}</DynamicText>
          </EllipsisWithTitle>
        </PortalBreadcrumbItem>
      );
    }
  }
  return (
    <PortalBreadcrumbItem>
      <EllipsisWithTitle maxWidth={MAX_BREADCRUMB_WIDTH}>{menuSchema.label}</EllipsisWithTitle>
    </PortalBreadcrumbItem>
  );
};
