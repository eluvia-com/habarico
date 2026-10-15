// Imperative controller for the docked side panel. `active` is undefined when the panel is
// closed. Generic over the opened payload (`TView`): the admin ring stays schema-agnostic and
// treats the payload as opaque; each consumer (schema, a story) supplies its own concrete type.
export type SidePanelController<TView = unknown> = {
  active?: TView;
  openView: (view: TView) => void;
  close: () => void;
};
