import {Identifier, RaRecord} from 'react-admin';
import {BooleanFieldVariant} from '@admin/components/fields/BooleanField';
import {ChoicesFieldVariant} from '@admin/components/fields/ChoicesField';
import {RecordRepresentationVariant} from '@admin/components/fields/RecordRepresentation';
import {SearchObjectHighlight} from '@admin/utils/highlight';
import {ColorType} from '@design/theme/core/palette';
import {LinkTarget} from '@foundation/utils/navigation';

// `SearchObjectHighlight` (an admin search-match shape) is re-exported here so `@schema/types`
// stays the single public source for the name and existing schema-layer imports keep working.
// `LinkTarget` (a foundation navigation term) is only imported for internal use below — it is
// public through the `@foundation` barrel, so it is deliberately NOT re-exported here (that would
// make it ambiguous at the package root, where both layer barrels are spread).
export type {SearchObjectHighlight} from '@admin/utils/highlight';

// ----------------------------------------------------------------------------
// Primitive / enum types
// ----------------------------------------------------------------------------

export type RequestMethodType = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type ViewType = 'edit' | 'create' | 'list' | 'show' | 'action';
export type ActionType =
  'view' | 'link' | 'resource' | 'save' | 'ai-assistant' | 'upload-files' | 'export';
// `ColorType` (a design-layer palette term) is re-exported so `@schema/types` stays the single
// public source for the contract's colour enum. The `@design` barrel does not export it, so
// there is no ambiguity at the package root.
export type {ColorType};
export type ColorWithInherit = ColorType | 'inherit';
export type BoxType =
  | 'tab'
  | 'tab-item'
  | 'wizard'
  | 'simple'
  | 'list'
  | 'array'
  | 'object'
  | 'grid'
  | 'grid-item'
  | 'gallery';
export type MenuType = 'view' | 'link' | 'text';
export type ViewModeType = 'dialog' | 'redirect' | 'sidepanel';
export type ActionStateType = 'running' | 'success' | 'error';
export type AfterSaveType = 'stay' | 'prev' | 'show' | 'list';

// A view opened in the list's docked side panel — the schema-specific payload for the generic
// admin `SidePanelController<SidePanelView>`.
export type SidePanelView = {
  resource: string;
  viewType: ViewType;
  viewName: string;
  actionName?: string;
  id?: Identifier;
  data?: Record<string, string>;
  target?: string;
};

// ----------------------------------------------------------------------------
// Endpoint / parameter types
// ----------------------------------------------------------------------------

export type ViewEndpointParameters = {
  path?: string;
  method: RequestMethodType;
  reference?: string;
  actionName?: string;
};

export type ViewActionEndpointParameters = {
  reference?: string;
  actionName?: string;
  recordPk?: Identifier;
};

export type ViewActionParameters = {
  name: string;
  choices: ActionViewChoice[];
  mode: ViewModeType;
  endpoint?: ViewActionEndpointParameters;
  parameters: Record<string, string>;
  dialogWidth?: string;
  // Keep the linked parent segments in the redirect path. Set per action; defaults to a button's
  // own default when omitted, and to `true` for row activation.
  keepLinkedParent?: boolean;
};

export type ViewActionDescriptorParameters = {
  choices?: ActionViewChoice[];
  mode?: ViewModeType;
  parameters?: Record<string, string>;
  keepLinkedParent?: boolean;
};

type LinkActionParameters = {
  url: string;
  target?: LinkTarget;
};

export type ResourceActionEndpointParameters = {
  path?: string;
  method: RequestMethodType;
  reference?: string;
  actionName?: string;
  recordPk?: Identifier;
};

type ResourceActionParameters = {
  endpoint: ResourceActionEndpointParameters;
  data: Record<string, string | number | boolean>;
  isBackground?: boolean;
};

type SaveActionParameters = {
  data: Record<string, string | number | boolean>;
  afterSave?: AfterSaveType;
};

export type UploadFilesActionParameters = {
  reference?: string;
  target?: string;
  accept?: string[];
  resizeWidth?: number;
  cropAspectRatio?: number;
  maxSize?: number;
  maxFiles?: number;
  upload?: UploadFieldOptions;
  data?: Record<string, string | number | boolean>;
  fileField: string;
};

export type ExportActionParameters = {
  format?: string;
  fields?: string[];
};

// ----------------------------------------------------------------------------
// Menu / service schema types
// ----------------------------------------------------------------------------

export type GlobalViewSchema = {
  name: string;
  type: ViewType;
  isDetail: boolean;
  endpoint: ViewEndpointParameters;
  // Default presentation mode emitted by the backend. Absent falls back to `redirect`.
  mode?: ViewModeType;
};

export type GlobalResourceActionSchema = {
  name: string;
  type: string;
  showInList: boolean;
  showInDetail: boolean;
  isDetail: boolean;
};

export type MenuGroupSchema = {
  name: string;
  label: string;
  priority: number;
  icon?: string;
  color?: ColorType;
  parent?: MenuGroupSchema;
};

export type ActionViewChoice = {
  label: string;
  parameters: Record<string, string>;
};

export type MenuSchema = MenuGroupSchema & {
  name: string;
  type: MenuType;
  view?: ViewActionParameters;
  link?: LinkActionParameters;
};

export type GlobalResourceSchema = {
  name: string;
  pkFieldName: string;
  label: string;
  menu?: MenuSchema;
  views: GlobalViewSchema[];
  actions: GlobalResourceActionSchema[];
  globalFulltextSearchEnabled?: boolean;
  url: string;
};

export type ServiceSchema = GlobalResourceSchema[];

export type ServicesSchema = {
  [name: string]: ServiceSchema;
};

// ----------------------------------------------------------------------------
// Field types
// ----------------------------------------------------------------------------

export type FieldFilters = {
  name: string;
  value: string | number | boolean;
}[];

export type FieldType = 'integer' | 'number' | 'boolean' | 'string' | 'object' | 'array';
export type FieldFormatType =
  | 'date'
  | 'date-time'
  | 'time'
  | 'text'
  | 'rich-text'
  | 'email'
  | 'url'
  | 'password'
  | 'base64-image'
  | 'base64-file'
  | 'uuid'
  | 'relation'
  | 'tree-relation'
  | 'choices'
  | 'ai'
  | 'ai-text'
  | 'search'
  | 'decimal'
  | 'phone'
  | 'range'
  | 'czech-birth-number'
  | 'czech-id-card-number'
  | 'czech-ico'
  | 'czech-dic'
  | 'czech-bank-account';

export type EnumType = {
  value: string | number;
  label: string;
  color?: ColorWithInherit;
  icon?: string;
}[];

export type DynamicRenderOptions = {
  showQuery?: string;
  requiredQuery?: string;
};

export type NumberFieldOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'currency' | 'unit';
  currency?: string;
  unit?: string;
};

export type PhoneFieldOptions = {
  defaultRegion?: string;
  allowedRegions?: string[];
};

export type ItemFieldSchema = {
  type: FieldType;
  format?: FieldFormatType;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  required?: boolean;
  defaultValue?: string | boolean | number;
  reference?: string;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
};

export type RelationFieldOptions = {
  filters?: FieldFilters;
  sort?: SortDescriptor;
  showLink?: boolean;
  linkMode?: ViewModeType;
  dialogWidth?: string;
  keepLinked_parent?: boolean;
  showEditButton?: boolean;
  showCreateButton?: boolean;
  preserveOrder?: boolean;
  parent?: string;
};

export type ChoicesFieldOptions = {
  iconsKey?: string;
};

export type ImageFieldOptions = {
  resizeWidth?: number;
  cropAspectRatio?: number;
};

export type AiFieldOptions = {
  sourceFields?: string[];
};

export type UploadProviderName = 's3-multipart' | 'tus';

// NOTE: `UploadFieldOptions` is the backend wire type. It must stay structurally compatible with the
// foundation transport contract `UploadTransportConfig` (`@foundation/utils/upload`), which the
// low-level uploader consumes without importing the schema. The bidirectional-assignability guard
// in `src/schema/__tests__/uploadOptions.contract.test-d.ts` fails typecheck if they drift apart.
export type UploadFieldOptions = {
  provider: UploadProviderName;
  threshold: number;
  chunkSize: number;
  /**
   * s3-multipart only; S3 hard minimum part size in bytes. The frontend uses it to decide
   * multipart vs. a single PUT before calling initiate (a file smaller than this cannot be
   * split into multiple parts).
   */
  minChunkSize?: number;
  /** s3-multipart only; already carries ?model=…&field=… */
  initiateUrl?: string;
  /** tus only */
  endpoint?: string;
};

/**
 * `type` is left as-is by the backend's snake_case-to-camelCase key conversion (it renames
 * object keys, not string values), so these must match the wire values verbatim.
 */
export type ValidatorRuleType = 'max_length' | 'min_length' | 'max_value' | 'min_value' | 'regex';

export type ValidatorRule = {
  type: ValidatorRuleType;
  value: number | string;
  /** Error message shown when the rule is violated. Falls back to a generic default when omitted. */
  message?: string;
};

export type FieldOptions = {
  choices?: ChoicesFieldOptions;
  image?: ImageFieldOptions;
  ai?: AiFieldOptions;
  upload?: UploadFieldOptions;
  maxSize?: number;
  maxFiles?: number;
  accept?: string[];
  dynamicRender?: DynamicRenderOptions;
  textAlign?: 'left' | 'right' | 'center';
  /** Where the field's link opens. Stored without the leading underscore - the client prepends it. */
  target?: LinkTarget;
  number?: NumberFieldOptions;
  phone?: PhoneFieldOptions;
  prefix?: string;
  postfix?: string;
  relation?: RelationFieldOptions;
  validators?: ValidatorRule[];
};

export type FieldSchema = {
  name: string;
  type: FieldType;
  format?: FieldFormatType;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  required?: boolean;
  defaultValue?: string | boolean | number;
  reference?: string;
  sortable?: boolean;
  sortBy?: string;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
  items?: ItemFieldSchema | FieldSchema;
  targetSource?: string;
};

export type FieldSchemaMap = {
  [key: string]: FieldSchema;
};

export type FilterSchema = {
  name: string;
  type: FieldType;
  format?: FieldFormatType;
  label: string;
  helpText?: string;
  defaultValue?: string | boolean | number;
  reference?: string;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
  items?: ItemFieldSchema | FieldSchema;
  isAlwaysOn?: boolean;
};

// ----------------------------------------------------------------------------
// Field presentation defaults
// ----------------------------------------------------------------------------

// The three shape vocabularies are re-exported from the admin components that own them, so
// `@schema/types` stays the single public source for the `fieldDefaults` surface while each
// component keeps defining the shapes it can actually render. The admin barrel exports the
// originals under their own names (`RecordRepresentationVariant`, `BooleanFieldVariant`,
// `ChoicesFieldVariant`), which is why these aliases are safe at the package root.

/** How a reference renders the record it points at. See `RecordRepresentation`. */
export type ReferenceVariant = RecordRepresentationVariant;

/** How a boolean renders. See `BooleanField`. */
export type BooleanVariant = BooleanFieldVariant;

/** How a single choice (or an array of them) renders. See `ChoicesField`. */
export type ChoicesVariant = ChoicesFieldVariant;

/**
 * The shape each kind of field takes when nothing says otherwise — the application's own look,
 * which no schema describes. Set once on `SchemaAdmin` (or per resource on `SchemaResource`) and
 * read by the schema field components; an explicit `variant` prop on a field still wins.
 *
 * Deliberately a record per kind of field rather than one value for all of them: a reference's
 * `'link'` means nothing to a boolean, and a kind added here later is opt-in by its own key
 * instead of silently changing how an existing project looks on a version bump.
 */
export type FieldDefaults = {
  reference?: ReferenceVariant;
  boolean?: BooleanVariant;
  choices?: ChoicesVariant;
};

// ----------------------------------------------------------------------------
// Sort / descriptor types
// ----------------------------------------------------------------------------

export type SortDescriptor = {
  fieldName: string;
  direction: 'asc' | 'desc';
};

export type Filters = {
  [name: string]: string | number | boolean;
};

export type FiltersConfiguration = Record<string, unknown>;

export type FieldWrapperProperties = {
  divider?: string;
  fields: FieldDescriptor[];
};

export type FieldDescriptor = {
  type: 'field';
  name: string;
  label?: string;
  shortLabel?: string;
  helpText?: string;
  sortable?: boolean;
  sortBy?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  defaultValue?: string | number | boolean;
  action?: ActionDescriptor | ActionSchema;
  wrapper?: FieldWrapperProperties;
  options?: FieldOptions;
  // carried through for aggregate widgets so the chart can render readable labels:
  // `enum` maps a raw choices value to its label/color, `format`/`reference` drive
  // value formatting and relation display
  format?: FieldFormatType;
  reference?: string;
  enum?: EnumType;
};

export type FilterDescriptor = {
  name: string;
  label?: string;
  helpText?: string;
  isAlwaysOn?: boolean;
  defaultValue?: string | number | boolean;
  options?: FieldOptions;
};

export type SortableParameters = {
  fieldName: string;
  sortForFilters: Record<string, string | number | boolean>;
};

// ----------------------------------------------------------------------------
// Action types
// ----------------------------------------------------------------------------

export type ActionSchema = {
  type: ActionType;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;
  isDetail: boolean;
  confirmDialog?: ConfirmDialogProperties;
  view?: ViewActionParameters;
  link?: LinkActionParameters;
  resource?: ResourceActionParameters;
  save?: SaveActionParameters;
  uploadFiles?: UploadFilesActionParameters;
  export?: ExportActionParameters;
};

export type ActionDescriptor = {
  name: string;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;
  action?: ActionSchema;
  view?: ViewActionDescriptorParameters;
  confirmDialog?: ConfirmDialogProperties;
  menuItems?: ActionDescriptor[];
};

export type ConfirmDialogProperties = {
  title: string;
  message: string;
};

export type ActionResultMeta = {
  message?: string;
  state?: ActionStateType;
  triggerAction?: ActionSchema;
};

export type ActionResult = {
  meta: ActionResultMeta;
};

// ----------------------------------------------------------------------------
// Box types
// ----------------------------------------------------------------------------

export type TabBoxParameters = {
  showToolbarNavigation?: boolean;
};

export type WizardBoxParameters = {
  showToolbarNavigation?: boolean;
  validateSteps?: boolean;
};

export type GridItemBoxParameters = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

export type ListBoxParameters = {
  target?: string;
  reference: string;
  rowActions?: ActionDescriptor[];
  toolbarActions?: ActionDescriptor[];
  listActions?: ActionDescriptor[];
  filters?: FilterDescriptor[];
  defaultSorting?: SortDescriptor;
  extraFilters?: Filters;
  sortable?: SortableParameters;
  schemaParams?: Record<string, string>;
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

export type GalleryBoxParameters = {
  reference: string;
  target?: string;
  imageField: string;
  filters?: FilterDescriptor[];
  defaultSorting?: SortDescriptor;
  extraFilters?: Filters;
  schemaParams?: Record<string, string>;
};

export type ObjectBoxParameters = {
  target: string;
};

export type ListedOptions = {
  fieldName: string;
  otherValues?: (string | number)[];
};

export type ArrayBoxParameters = {
  target: string;
  listed?: ListedOptions;
  inline?: boolean;
};

export type BoxItem = BoxSchema | FieldDescriptor;

export type BoxSchema = {
  name: string;
  label?: string;
  card?: boolean | null;
  collapsible?: 'open' | 'closed';
  boxes?: BoxItem[];
  type: BoxType;
  readOnly: boolean;
  toolbarActions?: ActionDescriptor[];
  bottomActions?: ActionDescriptor[];
  tab?: TabBoxParameters;
  wizard?: WizardBoxParameters;
  gridItem?: GridItemBoxParameters;
  list?: ListBoxParameters;
  object?: ObjectBoxParameters;
  array?: ArrayBoxParameters;
  gallery?: GalleryBoxParameters;
  options?: {
    dynamicRender?: DynamicRenderOptions;
  };
};

// ----------------------------------------------------------------------------
// View types
// ----------------------------------------------------------------------------

export type ListViewParameters = {
  boxes?: FieldDescriptor[];
  filters?: FilterDescriptor[];
  toolbarActions?: ActionDescriptor[];
  rowActions?: ActionDescriptor[];
  listActions?: ActionDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
  sortable?: SortableParameters;
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

export type DetailViewParameters = {
  box: BoxSchema;
  toolbarActions?: ActionDescriptor[];
  bottomActions?: ActionDescriptor[];
};

export type ViewSchema = {
  name: string;
  label?: string;
  type: ViewType;
  list?: ListViewParameters;
  detail?: DetailViewParameters;
  isDetail: boolean;
  endpoint: ViewEndpointParameters;
  breadcrumbs?: MenuSchema[];
};

// ----------------------------------------------------------------------------
// Resource schema types
// ----------------------------------------------------------------------------

export type ResourceActionSchema = ActionSchema & {
  name: string;
  showInList: boolean;
  showInDetail: boolean;
};

export type MethodSchema = {
  fields: FieldSchema[];
  filters?: FilterSchema[];
};

export type EndpointsSchema = Record<RequestMethodType, MethodSchema>;

export type LocalResourceSchema = {
  name: string;
  pkFieldName: string;
  views: ViewSchema[];
  actions: ResourceActionSchema[];
  endpoints: EndpointsSchema;
  url: string;
};

// ----------------------------------------------------------------------------
// Record meta types
// ----------------------------------------------------------------------------

export type RecordSchema = {
  name: string;
  pkFieldName: string;
  actions: ResourceActionSchema[];
};

export type RecordMeta = {
  schema: RecordSchema;
  repr: string;
  tags: string[];
  triggerAction?: ActionSchema;
  // Search highlights sidecar: present on list records when the request matched a search.
  highlights?: SearchObjectHighlight[];
};

export type HabRecord = RaRecord & {
  id: Identifier;
  meta: RecordMeta;
};

export type IndexedHabRecord = HabRecord & {index: number};

// ----------------------------------------------------------------------------
// AI Assistant
// ----------------------------------------------------------------------------

export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiAssistantField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  help_text: string | null;
  choices: Array<{id: unknown; label: string}> | null;
  parent?: string;
  is_array_item?: boolean;
};

export type AiAssistantRequest = {
  messages: AiChatMessage[];
  schema: {
    resource_name: string;
    view_type: 'create' | 'edit';
    fields: AiAssistantField[];
  };
  current_values: Record<string, unknown>;
};

export type AiAssistantResponse = {
  message: string;
  suggestions?: Record<string, unknown>;
};
