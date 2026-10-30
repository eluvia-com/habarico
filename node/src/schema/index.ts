// Schema layer — the schema-driven core: input = a Habarico schema, output = a complete admin UI.
// Top of the layered split `foundation → design → admin → schema`. See ./README.md for the layer
// contract.
//
// The schema-driven core (components, providers, contexts, hooks, utils, types) now lives entirely
// under `src/schema/**`; the HAB-668 top-level `contexts`/`hooks`/`providers`/`utils` folders have
// been dissolved into this layer.

// Schema-driven UI: views, boxes, fields, inputs, buttons, dashboard & widgets.
export * from './components';

// Providers — the schema / data providers and the pluggable default* customization providers.
export * from './providers/schemaProvider';
export * from './providers/dataProvider';
export * from './providers/defaultBoxProvider';
export * from './providers/defaultButtonProvider';
export * from './providers/defaultFieldProvider';
export * from './providers/defaultInputProvider';
export * from './providers/defaultValidatorProvider';
export * from './providers/defaultViewProvider';
export * from './providers/types';

// Contexts — the schema context ring (resource / view / box / field schema state).
export * from './contexts/ActionSchemaContext';
export * from './contexts/FieldSchemaContext';
export * from './contexts/FieldSchemaMapContext';
export * from './contexts/MethodSchemaContext';
export * from './contexts/ParentBoxContext';
export * from './contexts/ParentResourceDescriptorsContext';
// `Resource{Box,Button,Field,Input}Context` are intentionally NOT re-exported: their only export is a
// `Resource*Provider` context component whose name collides with the customization-provider *type* of
// the same name in `./providers/types` (the established public API). They stay sub-path-only.
export * from './contexts/LocalResourceSchemaContext';
export * from './contexts/SchemaRootContext';
export * from './contexts/SchemaViewRouterContext';
export * from './contexts/ViewSchemaContext';

// Hooks — schema fetching, resource element building, actions.
export * from './hooks/useGlobalResourceSchemaContext';
export * from './hooks/useCallAction';
export * from './hooks/useExporter';
export * from './hooks/useFormDefaultValues';
export * from './hooks/useGetGlobalResourceSchema';
export * from './hooks/useGetGlobalResourceSchemaContext';
export * from './hooks/useGetResourceRouterElement';
export * from './hooks/useGetLocalResourceSchema';
export * from './hooks/useGetResourceViewElement';
export * from './hooks/useGetServiceSchemas';
export * from './hooks/useGetTargetValues';
export * from './hooks/useHabRecordContext';
export * from './hooks/useListHref';
export * from './hooks/useResourceElements';
export * from './hooks/useSchemaProvider';
export * from './hooks/useSchemaRecordLinkOptions';
export * from './hooks/useSchemaValidators';
export * from './hooks/useLocalResourceSchemaRefresh';
export * from './hooks/useTriggerAction';

// Public schema utils (schema/record shaping, field selection, descriptor generation, stores).
export * from './utils/api';
export * from './utils/fieldSelection';
export * from './utils/generateDescriptorsFromSchema';
export * from './utils/generateFieldSchemaMap';
export * from './utils/preferencesStore';
export type {ActionContext} from './utils/actionDescriptor';
export * from './utils/resourceReference';
export * from './utils/schemaValidators';
export * from './utils/viewMode';

// Constants.

// Schema types (ServiceSchema, LocalResourceSchema, box / view / field schemas, the type/format unions).
export * from './types';
