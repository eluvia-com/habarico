import React from 'react';
import {ViewSidePanel} from '@admin/components/views/ViewSidePanel';
import {SidePanelView} from '@schema/types';
import {SchemaViewRouter} from '../SchemaViewRouter';

type SchemaSidePanelProps = {
  view: SidePanelView;
  onClose: () => void;
};

// Docked preview panel rendered beside a list. The resize behaviour, persistent width and overlay
// presentation (the view's title / actions portal into the panel header) all live in the admin-layer
// `ViewSidePanel`; this wrapper only maps the schema `SidePanelView` onto the `SchemaViewRouter`.
// The router is keyed by the target so selecting another row re-initialises it.
export const SchemaSidePanel = ({view, onClose}: SchemaSidePanelProps) => (
  <ViewSidePanel onClose={onClose}>
    <SchemaViewRouter
      key={`${view.resource}-${view.viewName}-${view.id ?? ''}`}
      resource={view.resource}
      viewType={view.viewType}
      viewName={view.viewName}
      actionName={view.actionName}
      id={view.id}
      data={view.data}
      target={view.target}
      onClose={onClose}
    />
  </ViewSidePanel>
);
