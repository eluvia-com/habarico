// Admin-layer components barrel — every renderable member under `admin/components/**`.
// Re-exported wholesale by the layer barrel (`@admin`). Non-component members (contexts, hooks,
// providers, utils, constants) live in `../index.ts`, not here.

// The base props shared by every field / input — what a custom one is written against.
export type {FieldProps} from './fields/types';
export type {InputProps} from './inputs/types';

// Auth dialogs and pages
export {ChangePasswordDialog, type ChangePasswordDialogProps} from './auth/ChangePasswordDialog';
export {UpdateIdentityDialog, type UpdateIdentityDialogProps} from './auth/UpdateIdentityDialog';
export {AuthPage, type AuthPageProps} from './auth/AuthPage';
export {ResetPasswordPage, type ResetPasswordPageProps} from './auth/ResetPasswordPage';
export {LogoutPage} from './auth/LogoutPage';

// Base entry point
export {AdminHashRouter, type AdminHashRouterProps} from './base/AdminHashRouter';
export {BaseAdmin, type BaseAdminProps} from './base/BaseAdmin';

// Buttons
export {
  ActionButton,
  type ActionButtonProps,
  type ActionButtonColor,
  type ActionButtonConfirm,
  ActionButtonWithChoices,
  type ActionButtonWithChoicesProps,
  type ActionChoice,
} from './buttons/ActionButton';
export {FilterButton, type FilterButtonProps} from './buttons/FilterButton';
export {FilterDrawerButton, type FilterDrawerButtonProps} from './buttons/FilterDrawerButton';
export {SavedQueriesButton, type SavedQueriesButtonProps} from './buttons/SavedQueriesButton';
export {
  ResetColumnsWidthDatagridButton,
  type ResetColumnsWidthDatagridButtonProps,
} from './buttons/ResetColumnsWidthDatagridButton';
export {
  ResetConfigurableDatagridButton,
  type ResetConfigurableDatagridButtonProps,
} from './buttons/ResetConfigurableDatagridButton';
export {
  ResetFiltersDatagridButton,
  type ResetFiltersDatagridButtonProps,
} from './buttons/ResetFiltersDatagridButton';
export {
  ResetSortDatagridButton,
  type ResetSortDatagridButtonProps,
} from './buttons/ResetSortDatagridButton';
export {SelectColumnsButton, type SelectColumnsButtonProps} from './buttons/SelectColumnsButton';
export {SaveButton, type SaveButtonProps} from './buttons/SaveButton';
export {SubmitButton} from './buttons/SubmitButton';
export {DeleteButton, type DeleteButtonProps} from './buttons/DeleteButton';
export {LinkButton, type LinkButtonProps} from './buttons/LinkButton';
export {LinkActionTrigger, type LinkActionTriggerProps} from './buttons/LinkActionTrigger';

// Common components
export {Loading} from './common/Loading';
export {DynamicText, type DynamicTextProps} from './common/DynamicText';
export {
  ResourceRepresentation,
  type ResourceRepresentationProps,
} from './common/ResourceRepresentation';
export {Notification, NotificationItem} from './common/Notification';
export {NotFound} from './common/NotFound';
export {ErrorPage} from './common/ErrorPage';
export {FormStatusLabel, type FormStatusLabelProps} from './common/FormStatusLabel';
export {NextButton, type NextButtonProps} from './common/NextButton';
export {PrevButton, type PrevButtonProps} from './common/PrevButton';
export {DraggableImagePanel} from './common/DraggableImagePanel';

// Datagrid
export {AdminDatagrid, type AdminDatagridProps} from './datagrid/AdminDatagrid';
export {DatagridActions, type DatagridActionsProps} from './datagrid/DatagridActions';
export {DatagridLabel, type DatagridLabelProps} from './datagrid/DatagridLabel';
export {DatagridRowTooltip, type DatagridTooltipFn} from './datagrid/DatagridRowTooltip';

// Dialogs
export {DraftRestoreDialog, type DraftRestoreDialogProps} from './dialogs/DraftRestoreDialog';
export {UnsavedChangesDialog, type UnsavedChangesDialogProps} from './dialogs/UnsavedChangesDialog';

// Fields
export {BooleanField, type BooleanFieldProps} from './fields/BooleanField';
export {ChipArrayField, type ChipArrayFieldProps} from './fields/ChipArrayField';
export {ChoicesField, type ChoicesFieldProps} from './fields/ChoicesField';
export {DateField, type DateFieldProps} from './fields/DateField';
export {EmailField} from './fields/EmailField';
export {ImageField} from './fields/ImageField';
export {NumberField, type NumberFieldProps} from './fields/NumberField';
export {PhoneNumberField} from './fields/PhoneNumberField';
export {ReferenceArrayField, type ReferenceArrayFieldProps} from './fields/ReferenceArrayField';
export {ReferenceField, type ReferenceFieldProps} from './fields/ReferenceField';
export {
  RecordRepresentation,
  type RecordRepresentationProps,
  type RecordRepresentationChipProps,
  type RecordRepresentationLinkProps,
  type RecordRepresentationVariant,
} from './fields/RecordRepresentation';
export {TextField, type TextFieldProps} from './fields/TextField';
export {TimeField, type TimeFieldProps} from './fields/TimeField';
export {TreeArrayField, type TreeArrayFieldProps} from './fields/TreeArrayField';
export {UrlField} from './fields/UrlField';
export {WrapperField, type WrapperFieldProps} from './fields/WrapperField';

// Inputs
export {
  AutocompleteArrayInput,
  type AutocompleteArrayInputProps,
} from './inputs/AutocompleteArrayInput';
export {AutocompleteInput, type AutocompleteInputProps} from './inputs/AutocompleteInput';
export {BooleanInput} from './inputs/BooleanInput';
export {CheckboxInput, type CheckboxInputProps} from './inputs/CheckboxInput';
export {ChoicesArrayInput, type ChoicesArrayInputProps} from './inputs/ChoicesArrayInput';
export {ChoicesInput, type ChoicesInputProps} from './inputs/ChoicesInput';
export {FormArrayInput, type FormArrayInputProps} from './inputs/FormArrayInput';
export {DateInput, type DateInputProps} from './inputs/DateInput';
export {DateRangeInput, type DateRangeInputProps} from './inputs/DateRangeInput';
export {DateTimeInput, type DateTimeInputProps} from './inputs/DateTimeInput';
export {NumberInput} from './inputs/NumberInput';
export {PhoneNumberInput} from './inputs/PhoneNumberInput';
export {SearchInput, type SearchInputProps} from './inputs/SearchInput';
export {TextInput, type TextInputProps} from './inputs/TextInput';
export {TimeInput, type TimeInputProps} from './inputs/TimeInput';
export {TreeArrayInput, type TreeArrayInputProps} from './inputs/TreeArrayInput';
export {TriStateBooleanInput} from './inputs/TriStateBooleanInput';
export {UploadInput, type UploadInputProps, type FileData} from './inputs/UploadInput';

// App shells
export * from './layouts/AdminDashboardLayout';
export * from './layouts/AdminAuthLayout';

// Settings bridge (react-admin ⇄ presentational SettingsContext) + its datagrid styles.
export * from './settings';

// View-layer members
export {ViewContent, type ViewContentProps} from './views/ViewContent';
export {ViewToolbar, type ViewToolbarProps} from './views/ViewToolbar';
export {ShowShell, type ShowShellProps} from './views/ShowShell';
export {PropertyShowLayout, type PropertyShowLayoutProps} from './views/PropertyShowLayout';
export {PropertyFormLayout, type PropertyFormLayoutProps} from './views/PropertyFormLayout';
export {FormShell, type FormShellProps} from './views/FormShell';
export {EditShell, type EditShellProps} from './views/EditShell';
export {CreateShell, type CreateShellProps} from './views/CreateShell';
export {ListShell, type ListShellProps} from './views/ListShell';
export {ListSurface, type ListSurfaceProps} from './views/ListSurface';
export {ViewSidePanel, type ViewSidePanelProps} from './views/ViewSidePanel';
export {ViewDialog, type ViewDialogProps} from './views/ViewDialog';
