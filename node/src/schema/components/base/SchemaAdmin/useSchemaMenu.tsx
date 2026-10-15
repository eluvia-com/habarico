import React, {useMemo} from 'react';
import {ResourceDefinition, useResourceDefinitions} from 'react-admin';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useCreateHabPath} from '@admin/hooks/useCreateHabPath';
import {Icon, IconType} from '@design/atoms/Icon';
import {LayoutMenuItem} from '@design/layouts/types';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {MenuGroupSchema} from '@schema/types';
import {ServiceConfig} from '@typing';
import {ExtraMenuItem, SchemaLayoutMenuItem} from './types';

type SchemaLayoutMenuItemMap = {[id: string]: SchemaLayoutMenuItem};

const compareByPriority = (a: {priority: number}, b: {priority: number}) => a.priority - b.priority;
const byName = (name: string) => (item: {name: string}) => item.name === name;
const byKey = (key: string) => (item: {key: string}) => item.key === key;

export const useSchemaMenu = (extraMenuItems?: ExtraMenuItem[]) => {
  const {serviceConfigMap, servicesSchema} = useSchemaRootContext();
  const createPath = useCreateHabPath();
  const resources = useResourceDefinitions();

  const menuItems: LayoutMenuItem[] = useMemo(() => {
    if (!serviceConfigMap) return [];

    const menuItems: SchemaLayoutMenuItem[] = [];
    const menuItemsMap: SchemaLayoutMenuItemMap = {} as SchemaLayoutMenuItemMap;

    const initServiceMenuItems = (
      serviceName: string,
      serviceConfig: ServiceConfig,
      index: number
    ) => {
      // Get all resources for the service
      const serviceResources = Object.values(resources).filter((resource) =>
        resource.name.startsWith(`${serviceName}/`)
      );

      // Service menu item is added if label is provided
      const addServiceMenuItem = !!serviceConfig.label;

      // Init map and list for service menu items
      const serviceMenuItemsMap: SchemaLayoutMenuItemMap = addServiceMenuItem ? {} : menuItemsMap;
      const serviceMenuItems: SchemaLayoutMenuItem[] = addServiceMenuItem ? [] : menuItems;

      // Recursive function to initialize menu items from menu group schema
      const initMenuGroup = (
        menuGroup: MenuGroupSchema,
        path: string,
        activePath?: string,
        child?: SchemaLayoutMenuItem
      ) => {
        // Create menu item if it doesn't exist
        if (!serviceMenuItemsMap[menuGroup.name]) {
          const icon = <Icon icon={menuGroup.icon as IconType} color={menuGroup.color} />;
          const newMenuItem = {
            key: menuGroup.name,
            title: <DynamicText>{menuGroup.label}</DynamicText>,
            href: path,
            activePath: activePath,
            icon: icon ?? <Icon icon={IconType.ViewList} />,
            priority: menuGroup.priority,
          };

          if (menuGroup.parent) {
            // Initialize parent of menu group
            initMenuGroup(menuGroup.parent, path, activePath, newMenuItem);
          } else {
            // Add menu item to root menu items
            serviceMenuItems.push(newMenuItem);
          }
          serviceMenuItemsMap[menuGroup.name] = newMenuItem;
        }

        const menuItem = serviceMenuItemsMap[menuGroup.name];
        if (child) {
          // Add child to parent and sort by priority
          menuItem.items = [...(menuItem.items || []), child].sort(compareByPriority);
          menuItem.href = menuItem.items[0].href; // Update href to first child
          menuItem.activePath = menuItem.items[0].activePath; // Match what the href points at
        }
      };

      // Initialize menu item for resource
      const initResourceMenuItem = (resource: ResourceDefinition): LayoutMenuItem | undefined => {
        const [serviceName, resourceName] = resource.name.split('/', 2);

        const serviceSchema = servicesSchema[serviceName];
        if (!serviceSchema) return; // Service schema was not found

        const resourceSchema = serviceSchema.find(byName(resourceName));
        if (!resourceSchema) return; // Resource schema was not found

        if (resourceSchema.menu?.type === 'view') {
          const viewParameters = resourceSchema.menu?.view;
          if (!viewParameters) return; // Resource does not have menu

          const viewType = resourceSchema.views.find(byName(viewParameters.name))?.type;
          if (!viewType) return; // View was not found

          const menuResource = viewParameters.endpoint?.reference || resource.name;
          const recordPk = viewParameters.endpoint?.recordPk;

          const path = createPath({
            type: viewType,
            resource: menuResource,
            actionName: viewParameters.endpoint?.actionName,
            id: recordPk,
          });

          // A menu bound to one record must stay highlighted on every view of that record.
          // React Admin nests them under the record base path `/{resource}/{id}` (which is
          // also its edit route), so match on that rather than on the deeper link target —
          // the show view sits one level below it, the edit view exactly on it.
          const activePath =
            recordPk === undefined || recordPk === null
              ? undefined
              : createPath({type: 'edit', resource: menuResource, id: recordPk});

          initMenuGroup(resourceSchema.menu!, path, activePath);
        } else if (resourceSchema.menu?.type === 'link') {
          const linkParameters = resourceSchema.menu?.link;
          if (!linkParameters) return; // Resource does not have menu

          const path = linkParameters.url;
          initMenuGroup(resourceSchema.menu!, path);
        }
      };

      // Initialize menu items for all service resources
      serviceResources.forEach((resources) => {
        initResourceMenuItem(resources);
      });
      // Add service menu item if it has any menu items
      if (addServiceMenuItem && serviceMenuItems.length > 0) {
        const items = serviceMenuItems.sort((a, b) => a.priority - b.priority);
        menuItems.push({
          key: serviceName,
          title: <DynamicText>{serviceConfig.label}</DynamicText>,
          href: items[0].href,
          activePath: items[0].activePath, // Match what the href points at
          icon: serviceConfig.icon,
          items: items,
          priority: index,
        });
      }
    };

    // Initialize menu items for all services
    Object.entries(serviceConfigMap).forEach(([serviceName, serviceConfig], index) => {
      initServiceMenuItems(serviceName, serviceConfig, index);
    });

    const updateMenuItemsWithExtra = (
      extraMenuItems: ExtraMenuItem[],
      menuItems: SchemaLayoutMenuItem[]
    ): SchemaLayoutMenuItem[] => {
      const updatedMenuItems = [...menuItems];
      extraMenuItems.forEach((extraItem) => {
        // Find and pop the existing item if it exists
        const foundItemIndex = updatedMenuItems.findIndex(byKey(extraItem.key));

        let foundItem: SchemaLayoutMenuItem | undefined = undefined;
        if (foundItemIndex !== -1) {
          foundItem = updatedMenuItems[foundItemIndex];
          updatedMenuItems.splice(foundItemIndex, 1);
        }

        const extraSubItems = extraItem.items || [];
        const foundSubItems = foundItem?.items || [];

        const title = extraItem.title || foundItem?.title;
        const href = extraItem.href || foundItem?.href;
        // An extra item that re-points the link invalidates the schema-derived match path.
        const activePath = extraItem.href ? undefined : foundItem?.activePath;

        if (title !== undefined && href !== undefined) {
          updatedMenuItems.push({
            key: extraItem.key,
            title: title,
            href: href,
            activePath: activePath,
            icon: extraItem.icon || foundItem?.icon || <Icon icon={IconType.ViewList} />,
            priority: extraItem.priority || foundItem?.priority || 100,
            items: updateMenuItemsWithExtra(extraSubItems, foundSubItems),
          });
        }
      });
      return updatedMenuItems.sort((a, b) => a.priority - b.priority);
    };

    // Sort menu items by priority and return
    return updateMenuItemsWithExtra(extraMenuItems || [], menuItems).sort(
      (a, b) => a.priority - b.priority
    );
  }, [serviceConfigMap, servicesSchema, resources, createPath, extraMenuItems]);
  return menuItems;
};
