// Admin layer — React Admin restyled into our design system.
// Resource-aware, schema-agnostic. See ./README.md for the layer contract.
//
// The public `@admin` barrel: it re-exports the layer's public members from each area's
// `index.ts` (plus the React Admin restyles under `overrides/ra-iu-materialui`).
//
// Rule: everything re-exported here must be schema-agnostic — no `@schema` imports may leak into
// this barrel (directly or transitively). The `boundaries/dependencies` lint rule enforces it.

// Types
export * from './types';

// Components
export * from './components';

// Overrides
export * from './overrides/ra-iu-materialui';

// Contexts
export {
  UploadingProvider,
  useUploadingContext,
  UploadingContext,
  type UploadingContextValue,
} from './contexts/UploadingContext';
export {useResourceContext, useResourceContextOrUndefined} from './contexts/ResourceContext';
export {
  RootRecordContextProvider,
  RootRecordContext,
  useRootRecordContext,
} from './contexts/RootRecordContext';
export {
  FormInputSourcesProvider,
  FormInputSourcesContext,
  FormInputSourcesRegistrationContext,
  useFormInputSourcesContext,
  useFormInputSourcesRegistration,
  type FormInputSourcesContextType,
  type FormInputSourcesRegistrationType,
} from './contexts/FormInputSourcesContext';
export {
  ListConfigProvider,
  useListConfigContext,
  type ListConfig,
} from './contexts/ListConfigContext';
export {
  ViewPresentationContext,
  ViewPresentationProvider,
  useViewPresentation,
  useOverlayPresentation,
  type OverlayPresentationSlots,
  type ViewPresentation,
  type ViewPresentationState,
} from './contexts/ViewPresentationContext';
export {
  AdminConfigContext,
  AdminConfigProvider,
  useAdminConfig,
  useIcons,
  type AdminConfig,
} from './contexts/AdminConfigContext';
export {
  SidePanelContext,
  SidePanelProvider,
  useSidePanelController,
  type SidePanelController,
} from './contexts/SidePanelContext';
export {
  FormExtensionsContext,
  FormExtensionsProvider,
  useFormExtensions,
  type FormExtensionsContextValue,
} from './contexts/FormExtensionsContext';
export {
  UnsavedChangesProvider,
  useUnsavedChanges,
  useUnsavedChangesControl,
} from './contexts/UnsavedChangesContext';

// Hooks
export {
  useUploadQueue,
  type UploadEntry,
  type UploadEntryPatch,
  type UseUploadQueueOptions,
  type UseUploadQueueResult,
} from './hooks/useUploadQueue';
export {useUploadAreaLabels} from './hooks/useUploadAreaLabels';
export {useFormArrayInputLabels, type FormArrayInputLabels} from './hooks/useFormArrayInputLabels';
export {useRemoveArrayItem} from './hooks/useRemoveArrayItem';
export {useRowClick} from './hooks/useRowClick';
export {useDraftStore} from './hooks/useDraftStore';
export {useStrTemplate} from './hooks/useStrTemplate';
export {useRecordIdOrUndefined} from './hooks/useRecordIdOrUndefined';
export {useTreeChoices, type UseTreeChoicesOptions} from './hooks/useTreeChoices';
export {useFieldHighlight} from './hooks/useFieldHighlight';
export {useGetI18nProvider} from './hooks/useGetI18nProvider';
export {
  usePerUserStore,
  type UsePerUserStoreOptions,
  type UsePerUserStoreResult,
} from './hooks/usePerUserStore';
export {useReferenceRepresentations} from './hooks/useReferenceRepresentations';
export {useSubmitForm} from './hooks/useSubmitForm';
export {useGetAll} from './hooks/useGetAll';
export {useCreateHabPath} from './hooks/useCreateHabPath';
export {useGetLinkWithData} from './hooks/useGetLinkWithData';
export {
  useRecordLink,
  type UseRecordLinkProps,
  type RecordLinkViewType,
  type RecordLinkOpenProps,
  type RecordLinkContentProps,
} from './hooks/useRecordLink';

// Providers
export * from './providers/buildServiceAuthProvider';
export * from './providers/types';

// Utils
export {type ApiError, extractErrorMessage, handleErrorResponse} from './utils/api';
export {type Choice, type Choices, choicesCarryColor, resolveChoice} from './utils/choices';
export {
  type BackendApi,
  type BackendStoreConfig,
  createBackendStore,
} from './utils/createBackendStore';
export {createPerUserStore, type PerUserStoreOptions} from './utils/createPerUserStore';
export {selfHighlightingField, isSelfHighlightingField} from './utils/highlight';
// `SearchObjectHighlight` (also in `./utils/highlight`) is intentionally NOT re-exported here: it
// stays public through `@schema/types` only, to keep a single source for the name at the package
// root. Admin-internal code imports it by sub-path from `@admin/utils/highlight`.

// Theme — the React Admin defaults every admin root applies over the design-system theme.
export {withRaDefaults} from './theme';

// Constants
export * from './constants';
