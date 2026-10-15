// @ts-nocheck
import * as React from 'react';
import {FieldsSelector, useSetInspectorTitle} from 'react-admin';

export const DatagridEditor = () => {
  useSetInspectorTitle('ra.inspector.Datagrid.title', {_: 'Datagrid'});

  return <FieldsSelector name="columns" availableName="availableColumns" />;
};
