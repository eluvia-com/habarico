import React, {Children, ReactElement, ReactNode} from 'react';
import {ResourceProps} from 'react-admin';
import {SchemaResourceProps} from '@schema/components/base/SchemaResource';

type WithRaName = {raName?: string};

const getRaName = (el: ReactElement): string | undefined => {
  const t = el.type;
  return typeof t === 'function' || typeof t === 'object' ? (t as WithRaName).raName : undefined;
};

export const separateAdminChildren = (children: ReactNode) => {
  const childrenArray = Array.isArray(children) ? children : [children];

  const resources: {[name: string]: ReactElement} = {};
  const otherElements: ReactElement[] = [];

  Children.forEach(childrenArray, (element) => {
    // Ignore non-elements. This allows people to more easily inline
    // conditionals in their route config.
    if (!React.isValidElement(element)) return;

    if (getRaName(element) === 'Resource') {
      const resource = element as ReactElement<ResourceProps>;
      resources[resource.props.name] = resource;
    } else if (getRaName(element) === 'SchemaResource') {
      const schemaResource = element as ReactElement<SchemaResourceProps>;
      resources[schemaResource.props.name] = schemaResource;
    } else {
      otherElements.push(element);
    }
  });
  return {resources, otherElements};
};
