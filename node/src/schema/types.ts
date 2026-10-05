import {Identifier, RaRecord} from 'react-admin';
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
  'view' | 'link' | 'resource' | 'save' | 'ai-assistant' | 'upload-images' | 'export';
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

/**
 * Address of a resource, optionally narrowed to one record and one of its actions. `service` is
 * always set: the client fills it in from the schema it loaded when the backend leaves it out.
 */
export type ResourceReference = {
  service: string;
  resource: string;
  recordPk?: Identifier;
  actionName?: string;
  params?: Record<string, string | number | boolean>;
};

export type ViewEndpointParameters = {
  path?: string;
  method: RequestMethodType;
  reference?: ResourceReference;
};

export type ViewActionParameters = {
  name: string;
  choices: ActionViewChoice[];
  mode: ViewModeType;
  endpoint?: ResourceReference;
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
  reference?: ResourceReference;
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

export type UploadImagesActionParameters = {
  reference?: ResourceReference;
  target?: string;
  accept?: string[];
  resizeWidth?: number;
  cropAspectRatio?: number;
  maxSize?: number;
  maxFiles?: number;
  upload?: UploadFieldOptions;
  data?: Record<string, string | number | boolean>;
  imageField: string;
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
  reference?: ResourceReference;
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
  reference?: ResourceReference;
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
  reference?: ResourceReference;
  enum?: EnumType;
  options?: FieldOptions;
  properties?: FieldSchema[];
  items?: ItemFieldSchema | FieldSchema;
  isAlwaysOn?: boolean;
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
  reference?: ResourceReference;
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
  uploadImages?: UploadImagesActionParameters;
  export?: ExportActionParameters;
};

export type ActionDescriptor = {
  // the wire always carries it; a descriptor written in code may leave it out
  type?: 'action';
  name: string;
  label?: string;
  icon?: string;
  color?: ColorWithInherit;
  action?: ActionSchema;
  reference?: ResourceReference;
  view?: ViewActionDescriptorParameters;
  confirmDialog?: ConfirmDialogProperties;
  menuItems?: ActionDescriptor[];
};

/**
 * Which of a resource's actions a `DefaultActionsDescriptor` expands: `list` the ones over the
 * collection (`isDetail` false), `detail` the ones over one record, `all` both.
 */
export type ActionScopeType = 'list' | 'detail' | 'all';

/** Stands for a resource's default actions in a list of actions; the client expands it. */
export type DefaultActionsDescriptor = {
  type: 'default_actions';
  // absent = the resource the list is rendered for
  reference?: ResourceReference;
  scope?: ActionScopeType;
};

/** One entry of a list of actions: a single action, or a resource's default actions. */
export type AnyActionDescriptor = ActionDescriptor | DefaultActionsDescriptor;

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
  reference: ResourceReference;
  rowActions?: AnyActionDescriptor[];
  listActions?: AnyActionDescriptor[];
  filters?: FilterDescriptor[];
  defaultSorting?: SortDescriptor;
  extraFilters?: Filters;
  sortable?: SortableParameters;
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

export type GalleryBoxParameters = {
  reference: ResourceReference;
  target?: string;
  imageField: string;
  filters?: FilterDescriptor[];
  defaultSorting?: SortDescriptor;
  extraFilters?: Filters;
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
  toolbarActions?: AnyActionDescriptor[];
  bottomActions?: AnyActionDescriptor[];
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
  toolbarActions?: AnyActionDescriptor[];
  rowActions?: AnyActionDescriptor[];
  listActions?: AnyActionDescriptor[];
  extraFilters?: Record<string, string | number | boolean>;
  defaultSorting?: SortDescriptor;
  sortable?: SortableParameters;
  singleClickAction?: ActionDescriptor;
  doubleClickAction?: ActionDescriptor;
};

export type DetailViewParameters = {
  box: BoxSchema;
  toolbarActions?: AnyActionDescriptor[];
  bottomActions?: AnyActionDescriptor[];
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
