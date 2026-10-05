import fakeDataProvider from 'ra-data-fakerest';
import React from 'react';
import {
  CoreAdminContext,
  type DataProvider,
  RecordContextProvider,
  ResourceContextProvider,
  TestMemoryRouter,
} from 'react-admin';
import {i18nProvider} from '@admin/pages/_i18n';
import {StoryAdminConfigProvider} from '@admin/pages/_storyConfig';
import type {ServiceAuthProvider} from '@admin/providers/types';
import {LocaleProvider} from '@design/theme';
import {TabsLocationProvider} from '@foundation/hooks/useTabsLocation';
import {Box, Divider, Typography} from '@mui/material';
import {SchemaBox} from '@schema/components/boxes/SchemaBox';
import {SchemaImagesBox} from '@schema/components/boxes/SchemaImagesBox';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {MethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import type {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {ViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {defaultBoxProvider} from '@schema/providers/defaultBoxProvider';
import {defaultButtonProvider} from '@schema/providers/defaultButtonProvider';
import {defaultFieldProvider} from '@schema/providers/defaultFieldProvider';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import {defaultViewProvider} from '@schema/providers/defaultViewProvider';
import type {SchemaProvider, ServiceDataProvider} from '@schema/providers/types';
import type {
  ActionDescriptor,
  AnyActionDescriptor,
  BoxSchema,
  EndpointsSchema,
  FieldSchema,
  GlobalResourceActionSchema,
  GlobalResourceSchema,
  GlobalViewSchema,
  HabRecord,
  ListBoxParameters,
  LocalResourceSchema,
  MethodSchema,
  RecordMeta,
  ResourceActionSchema,
  ResourceReference,
  ServiceSchema,
  ServicesSchema,
  ViewActionParameters,
  ViewSchema,
} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import type {FieldDescriptor, ServiceConfigMap} from '@typing';

/**
 * # Box toolbar actions — where do they land?
 *
 * A box can declare toolbar actions in more than one place, and the placement rules are subtle
 * enough to look like a bug. Each story here renders **several boxes of one type stacked under each
 * other**, each configured differently, so the effect of every placement is visible side by side —
 * without the surrounding `SchemaAdmin` chrome (no menu, no app bar). The boxes are mounted directly
 * on the minimal context stack they need (`CoreAdminContext` + the schema-layer contexts), the same
 * approach the field / input / `SchemaChoicesArrayBox` story kits use.
 *
 * ## The two slots
 *
 * | Schema key              | Rendered in          | Resolved against                                 | Component              |
 * |-------------------------|----------------------|--------------------------------------------------|------------------------|
 * | `box.toolbar_actions`   | box **header**       | the **parent** record, or an entry's `reference` | `buildBoxHeaderActions` |
 * | `box.list.list_actions` | **datagrid** toolbar | the **referenced** resource                      | `SchemaListBoxActions`  |
 *
 * ## Why a bare `{name: 'create'}` behaves "backwards"
 *
 * A descriptor renders only when it **resolves** — either it carries an inline `action`, or its
 * `name` is found in the action schema of the resource of the context it renders in (`SchemaButtons`
 * → `isValidDescriptor`). `create` is a **list-level** action of the *referenced* resource
 * (`items`); it is **not** an action of the *parent* record (`orders`).
 *
 * - With a `reference` to `items` it is resolved against `items` → found → the header button shows,
 *   and the reference's `params._target` links the new item to the order.
 * - Without one it is resolved against the parent `orders` → not found → dropped.
 *
 * A slot left unset renders nothing — no action is inferred from the resource. A backend fills a
 * slot its author did not configure with a `DefaultActions` entry, which the client expands into the
 * resource's actions of that scope. The builders below do the same for the row buttons
 * (`row_actions: [DefaultActions(scope=detail)]`); box 5 asks for the collection's defaults in the
 * datagrid toolbar the same way.
 *
 * The same rules apply to `SchemaSimpleBox` (one header slot, resolved against the box's own record)
 * and to the gallery box, which share `buildBoxHeaderActions`.
 */

// ----------------------------------------------------------------------------
// Service identity — one mock service ("shop") with two resources: orders + items.
// ----------------------------------------------------------------------------

const SERVICE_NAME = 'shop';
const SERVICE_URL = 'https://mock.habarico.test/shop';

const ORDERS_RESOURCE = `${SERVICE_NAME}/orders`;
const ITEMS_RESOURCE = `${SERVICE_NAME}/items`;
const ITEMS_REFERENCE: ResourceReference = {service: SERVICE_NAME, resource: 'items'};
// The order's items, linked back to the order shown — what a backend sends for `LIST` in a box header.
const ITEMS_OF_ORDER: ResourceReference = {
  ...ITEMS_REFERENCE,
  params: {_target: JSON.stringify({order_id: 1}), _source: JSON.stringify({[ORDERS_RESOURCE]: 1})},
};
const ITEMS_HEADER_ACTIONS: AnyActionDescriptor[] = [
  {name: 'create', reference: ITEMS_OF_ORDER},
  {name: 'export', reference: ITEMS_OF_ORDER},
];
// what a backend sends for a row slot its author left unset
const ROW_DEFAULTS: AnyActionDescriptor[] = [{type: 'default_actions', scope: 'detail'}];

const ORDERS_URL = `${SERVICE_URL}/orders/`;
const ITEMS_URL = `${SERVICE_URL}/items/`;

const SERVICE_CONFIG_MAP: ServiceConfigMap = {[SERVICE_NAME]: {url: SERVICE_URL}};

// ----------------------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------------------

// An inline SVG data URI so the images box renders offline (no network in stories).
const itemImage = (label: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="${color}"/><text x="80" y="66" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle">${label}</text></svg>`;
  return {url: `data:image/svg+xml,${encodeURIComponent(svg)}`, filename: `${label}.svg`};
};

const ORDERS = [{id: 1, code: 'OBJ-2026-001', customer: 'Jan Novák', note: 'Doručit do pátku.'}];
const ITEMS = [
  {
    id: 1,
    order_id: 1,
    name: 'Klávesnice',
    quantity: 2,
    price: 890,
    image: itemImage('Klávesnice', '#2f6f6f'),
  },
  {id: 2, order_id: 1, name: 'Myš', quantity: 2, price: 450, image: itemImage('Myš', '#3f7fae')},
  {
    id: 3,
    order_id: 1,
    name: 'Monitor 27"',
    quantity: 1,
    price: 6490,
    image: itemImage('Monitor', '#8a5fae'),
  },
];

// ----------------------------------------------------------------------------
// Schema authoring helpers
// ----------------------------------------------------------------------------

const fd = (name: string, extra: Partial<FieldDescriptor> = {}): FieldDescriptor => ({
  type: 'field',
  name,
  ...extra,
});

// A plain redirect view target. `choices: []` is truthy and would turn the button into a
// (choice-less, invisible) split button, so it is deliberately omitted via the cast.
const redirectView = (name: string): ViewActionParameters =>
  ({name, mode: 'redirect', parameters: {}}) as ViewActionParameters;

const emptyMethods = (fields: FieldSchema[]): EndpointsSchema => ({
  get: {fields},
  post: {fields},
  put: {fields},
  patch: {fields: []},
  delete: {fields: []},
});

// ----------------------------------------------------------------------------
// Items resource — the referenced (list) resource.
// ----------------------------------------------------------------------------

const ITEM_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'order_id', type: 'integer', label: 'Objednávka'},
  {name: 'name', type: 'string', format: 'text', label: 'Název', sortable: true},
  {name: 'quantity', type: 'integer', label: 'Počet'},
  {name: 'price', type: 'integer', label: 'Cena (Kč)'},
  {name: 'image', type: 'object', format: 'base64-image', label: 'Obrázek'},
];

// `show` / `edit` are `showInList` record actions → the row slot's `DefaultActions(scope=detail)`
// expands into them (eye / pencil). `create` and `export` are list-level (`showInList: false`), so
// they never reach the rows; they exist to be named from a toolbar slot.
const ITEM_ACTIONS: ResourceActionSchema[] = [
  {
    name: 'show',
    type: 'view',
    isDetail: true,
    showInList: true,
    showInDetail: false,
    label: 'Detail',
    icon: 'Visibility',
    view: redirectView('show'),
  },
  {
    name: 'edit',
    type: 'view',
    isDetail: true,
    showInList: true,
    showInDetail: false,
    label: 'Upravit',
    icon: 'Edit',
    view: redirectView('edit'),
  },
  {
    name: 'create',
    type: 'view',
    isDetail: false,
    showInList: true,
    showInDetail: false,
    label: 'Přidat produkt',
    icon: 'Add',
    view: redirectView('create'),
  },
  {
    name: 'export',
    type: 'view',
    isDetail: false,
    showInList: false,
    showInDetail: false,
    label: 'Exportovat',
    icon: 'Download',
    view: redirectView('export'),
  },
];

const ITEM_VIEWS: ViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}, list: {}},
  {
    name: 'create',
    type: 'create',
    isDetail: false,
    label: 'Nová položka',
    endpoint: {method: 'post'},
  },
  {name: 'show', type: 'show', isDetail: true, label: 'Položka', endpoint: {method: 'get'}},
  {name: 'edit', type: 'edit', isDetail: true, label: 'Úprava položky', endpoint: {method: 'put'}},
  {
    name: 'export',
    type: 'action',
    isDetail: false,
    label: 'Export',
    endpoint: {
      method: 'get',
      reference: {service: SERVICE_NAME, resource: 'items', actionName: 'export'},
    },
  },
];

const ITEM_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'items',
  pkFieldName: 'id',
  url: ITEMS_URL,
  actions: ITEM_ACTIONS,
  endpoints: emptyMethods(ITEM_FIELDS),
  views: ITEM_VIEWS,
};

// ----------------------------------------------------------------------------
// Orders resource — the parent. Deliberately NO `create` action here (`create` is a list-level
// action of `items`, not of an order record), so a bare `{name: 'create'}` on `box.toolbar_actions`
// cannot resolve against an order and gets dropped; `edit` — a real order action — resolves.
// ----------------------------------------------------------------------------

const ORDER_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'code', type: 'string', format: 'text', label: 'Číslo objednávky', sortable: true},
  {name: 'customer', type: 'string', format: 'text', label: 'Zákazník'},
  {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
];

const ORDER_ACTIONS: ResourceActionSchema[] = [
  {
    name: 'edit',
    type: 'view',
    isDetail: true,
    showInList: false,
    showInDetail: true,
    label: 'Upravit objednávku',
    icon: 'Edit',
    view: redirectView('edit'),
  },
];

const ORDER_VIEWS: ViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}, list: {}},
  {name: 'show', type: 'show', isDetail: true, label: 'Objednávka', endpoint: {method: 'get'}},
  {
    name: 'edit',
    type: 'edit',
    isDetail: true,
    label: 'Úprava objednávky',
    endpoint: {method: 'put'},
  },
  {
    name: 'create',
    type: 'create',
    isDetail: false,
    label: 'Nová objednávka',
    endpoint: {method: 'post'},
  },
];

const ORDER_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'orders',
  pkFieldName: 'id',
  url: ORDERS_URL,
  actions: ORDER_ACTIONS,
  endpoints: emptyMethods(ORDER_FIELDS),
  views: ORDER_VIEWS,
};

const ORDER_METHOD: MethodSchema = {fields: ORDER_FIELDS};
const ORDER_SHOW_VIEW: ViewSchema = ORDER_VIEWS[1];

// ----------------------------------------------------------------------------
// Service schema (the menu-level GlobalResourceSchema list) — needed so the list box can resolve the
// referenced resource's url and its action / view schemas.
// ----------------------------------------------------------------------------

const toBaseActions = (actions: ResourceActionSchema[]): GlobalResourceActionSchema[] =>
  actions.map(({name, type, isDetail, showInList, showInDetail}) => ({
    name,
    type,
    isDetail,
    showInList,
    showInDetail,
  }));

const baseViews = (views: ViewSchema[]): GlobalViewSchema[] =>
  views.map(({name, type, isDetail, endpoint}) => ({name, type, isDetail, endpoint}));

const SERVICE_SCHEMA: ServiceSchema = [
  {
    name: 'orders',
    pkFieldName: 'id',
    label: 'Objednávky',
    url: ORDERS_URL,
    views: baseViews(ORDER_VIEWS),
    actions: toBaseActions(ORDER_ACTIONS),
  } satisfies GlobalResourceSchema,
  {
    name: 'items',
    pkFieldName: 'id',
    label: 'Položky',
    url: ITEMS_URL,
    views: baseViews(ITEM_VIEWS),
    actions: toBaseActions(ITEM_ACTIONS),
  } satisfies GlobalResourceSchema,
];

// ----------------------------------------------------------------------------
// Mock providers
// ----------------------------------------------------------------------------

const RESOURCE_ACTIONS_BY_RESOURCE: Record<string, ResourceActionSchema[]> = {
  [ORDERS_RESOURCE]: ORDER_ACTIONS,
  [ITEMS_RESOURCE]: ITEM_ACTIONS,
};

const decorate = (resource: string, record: Record<string, unknown>): HabRecord => {
  const resourceName = resource.split('/')[1] ?? resource;
  const meta: RecordMeta = {
    schema: {
      name: resourceName,
      pkFieldName: 'id',
      actions: RESOURCE_ACTIONS_BY_RESOURCE[resource] ?? [],
    },
    repr: String(record.name ?? record.code ?? record.id ?? ''),
    tags: [],
  };
  return {...record, meta} as HabRecord;
};

const RESOURCE_SCHEMA_BY_URL: Record<string, LocalResourceSchema> = {
  [ORDERS_URL]: ORDER_RESOURCE_SCHEMA,
  [ITEMS_URL]: ITEM_RESOURCE_SCHEMA,
};

const schemaProvider: SchemaProvider = {
  getServiceSchema: () => Promise.resolve(SERVICE_SCHEMA),
  getRecordSchema: (resourceUrl) => {
    const schema = RESOURCE_SCHEMA_BY_URL[resourceUrl];
    if (!schema) return Promise.reject(new Error(`No mock schema for ${resourceUrl}`));
    return Promise.resolve(schema);
  },
  listPreferences: () => Promise.resolve({}),
  setPreference: () => Promise.resolve(),
  deletePreference: () => Promise.resolve(),
  deleteAllPreferences: () => Promise.resolve(),
};

const createDataProvider = (): ServiceDataProvider => {
  const base: DataProvider = fakeDataProvider(
    {[ORDERS_RESOURCE]: ORDERS.map((o) => ({...o})), [ITEMS_RESOURCE]: ITEMS.map((i) => ({...i}))},
    false
  );
  const mapList = async <T extends {data: Record<string, unknown>[]}>(
    resource: string,
    promise: Promise<T>
  ) => {
    const result = await promise;
    return {...result, data: result.data.map((record) => decorate(resource, record))};
  };
  const mapOne = async <T extends {data: Record<string, unknown>}>(
    resource: string,
    promise: Promise<T>
  ) => {
    const result = await promise;
    return {...result, data: decorate(resource, result.data)};
  };
  return {
    ...base,
    getList: (resource, params) => mapList(resource, base.getList(resource, params)),
    getMany: (resource, params) => mapList(resource, base.getMany(resource, params)),
    getManyReference: (resource, params) =>
      mapList(resource, base.getManyReference(resource, params)),
    getOne: (resource, params) => mapOne(resource, base.getOne(resource, params)),
    create: (resource, params) => mapOne(resource, base.create(resource, params)),
    update: (resource, params) => mapOne(resource, base.update(resource, params)),
    delete: (resource, params) => mapOne(resource, base.delete(resource, params)),
    callAction: async () => ({data: {meta: {state: 'success', message: 'Hotovo'}}}),
    export: (resource, params) =>
      Promise.resolve({
        status: 200,
        blob: new Blob(['id\n1\n'], {type: 'text/csv'}),
        filename: `${resource.replace('/', '_')}.${params.format}`,
      }),
  } as ServiceDataProvider;
};

const mockAuthProvider: ServiceAuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({id: 1, fullName: 'Martina Nováková'}),
  resetPassword: () => Promise.resolve(),
  setPassword: () => Promise.resolve(new Response()),
  isAuthenticated: () => true,
  updateIdentity: () => Promise.resolve(new Response()),
  changePassword: () => Promise.resolve(),
  verifyMfa: () => Promise.resolve(new Response()),
  requestMfaChallenge: () => Promise.resolve({} as never),
  getAuthHeaders: () => ({}),
};

// One data provider shared across stories (no per-story mutation).
const dataProvider = createDataProvider();
const ORDER_RECORD = decorate(ORDERS_RESOURCE, ORDERS[0]);

// The `SchemaRootContext` value `SchemaAdmin` would normally build — assembled here directly so the
// boxes mount without the admin layout. Fetching boxes (the list box) read `schemaProvider` /
// `servicesSchema` from here; the `default*Provider`s are the stock renderers.
const SCHEMA_ROOT: SchemaRootContextState = {
  schemaProvider,
  dataProvider,
  authProvider: mockAuthProvider,
  servicesSchema: {[SERVICE_NAME]: SERVICE_SCHEMA} as ServicesSchema,
  refetchSchema: () => undefined,
  serviceConfigMap: SERVICE_CONFIG_MAP,
  resources: {},
  defaultRowAction: 'none',
  isLoaded: true,
  defaultFieldProvider,
  defaultInputProvider,
  defaultValidatorProvider,
  defaultBoxProvider,
  defaultButtonProvider,
  defaultViewProvider,
  hasDashboard: false,
  userIdentity: {id: 1, fullName: 'Martina Nováková'},
  setUserIdentity: () => undefined,
};

// ----------------------------------------------------------------------------
// Box builders — each demonstrated box wrapped in a bare card-less root box (so the box is nested,
// exactly as inside a real detail layout). The box `label` doubles as the caption of what it shows.
// ----------------------------------------------------------------------------

const rootWrap = (name: string, inner: BoxSchema): BoxSchema => ({
  name: `${name}_root`,
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [inner],
});

type ListBoxOverrides = {
  /** box-level header actions (`box.toolbar_actions`) */
  toolbarActions?: AnyActionDescriptor[];
  /** list-level config (`list.*`); `reference` / `target` are always supplied by the builder */
  list?: Partial<ListBoxParameters>;
};

// A list box bound to `items` (target `order_id`) with three field columns. Its row slot carries what
// a backend sends for an unset one (`ROW_DEFAULTS`); every other slot is exactly what the story sets.
const itemsListBox = (name: string, label: string, overrides: ListBoxOverrides = {}): BoxSchema =>
  rootWrap(name, {
    name,
    type: 'list',
    label,
    card: true,
    readOnly: true,
    ...(overrides.toolbarActions ? {toolbarActions: overrides.toolbarActions} : {}),
    list: {
      reference: ITEMS_REFERENCE,
      target: 'order_id',
      rowActions: ROW_DEFAULTS,
      ...overrides.list,
    },
    boxes: [fd('name'), fd('quantity'), fd('price')],
  });

// An images box (SchemaImagesBox) with the same list config as itemsListBox, but its content is the
// image grid (`boxes` include the `image` field). Rendered directly — there is no `images` BoxType in
// the free-package provider, so SchemaBox would not route to it.
const imagesBox = (name: string, label: string, overrides: ListBoxOverrides = {}): BoxSchema => ({
  name,
  type: 'list',
  label,
  card: true,
  readOnly: true,
  ...(overrides.toolbarActions ? {toolbarActions: overrides.toolbarActions} : {}),
  list: {
    reference: ITEMS_REFERENCE,
    target: 'order_id',
    rowActions: ROW_DEFAULTS,
    ...overrides.list,
  },
  boxes: [fd('image'), fd('name'), fd('price')],
});

const orderSummaryBox = (
  name: string,
  label: string,
  toolbarActions?: ActionDescriptor[]
): BoxSchema =>
  rootWrap(name, {
    name,
    type: 'simple',
    label,
    card: true,
    readOnly: false,
    ...(toolbarActions ? {toolbarActions} : {}),
    boxes: [fd('code'), fd('customer'), fd('note')],
  });

// A tab box whose child tabs are two simple boxes of order fields. `toolbarActions` resolve against
// the parent order (same slot rule as a simple box). The `card` / `label` overrides decide where the
// toolbar lands: card-less → the tab strip's own header (flush right); with a label → the card
// header, like any other box. The buttons are `small` either way.
const detailTabBox = (name: string, overrides: Partial<BoxSchema> = {}): BoxSchema =>
  rootWrap(name, {
    name,
    type: 'tab',
    readOnly: false,
    boxes: [
      {
        name: 'summary',
        label: 'Souhrn',
        type: 'simple',
        readOnly: false,
        boxes: [fd('code'), fd('customer')],
      },
      {
        name: 'note',
        label: 'Poznámka',
        type: 'simple',
        readOnly: false,
        boxes: [fd('note')],
      },
    ],
    ...overrides,
  });

// A wizard box: the same steps as the tab box, but walked one at a time with a `Stepper` and
// Prev/Next navigation. `toolbarActions` resolve against the parent order and land the same way the
// tab box's do — card-less → the stepper's own header (flush right, via `NavigationHeader`); with a
// label → the card header, like any other box; `small` buttons either way. `bottomActions` land in
// the footer beside Prev/Next (`showToolbarNavigation` is on by default here). The showcase mounts a
// record, so it reads as an edit view: every step is reachable and any bottom action shows on every step.
const detailWizardBox = (name: string, overrides: Partial<BoxSchema> = {}): BoxSchema =>
  rootWrap(name, {
    name,
    type: 'wizard',
    readOnly: false,
    boxes: [
      {
        name: 'step_summary',
        label: 'Souhrn',
        type: 'simple',
        readOnly: false,
        boxes: [fd('code'), fd('customer')],
      },
      {
        name: 'step_note',
        label: 'Poznámka',
        type: 'simple',
        readOnly: false,
        boxes: [fd('note')],
      },
    ],
    ...overrides,
  });

const inlineAction: ActionDescriptor = {
  name: 'box_action',
  label: 'Sdílet',
  icon: 'Share',
  action: {type: 'view', isDetail: false, view: redirectView('create')},
};

// ----------------------------------------------------------------------------
// Story shell — the boxes stacked on the minimal context stack, no SchemaAdmin layout.
// ----------------------------------------------------------------------------

// The minimal context stack (no SchemaAdmin layout) shared by every story; children render stacked in
// a bounded column.
const ShowcaseShell = ({title, children}: {title: string; children: React.ReactNode}) => (
  <TestMemoryRouter initialEntries={['/']}>
    <CoreAdminContext
      dataProvider={dataProvider}
      authProvider={mockAuthProvider}
      i18nProvider={i18nProvider}
    >
      <LocaleProvider>
        {/* A tab box reads its active tab from here; ViewContent mounts one per view in the real app. */}
        <TabsLocationProvider syncWithLocation={false}>
          <StoryAdminConfigProvider>
            <SchemaRootContext.Provider value={SCHEMA_ROOT}>
              <ResourceContextProvider value={ORDERS_RESOURCE}>
                <RecordContextProvider value={ORDER_RECORD}>
                  <LocalResourceSchemaProvider
                    resource={ORDERS_RESOURCE}
                    schema={ORDER_RESOURCE_SCHEMA}
                  >
                    <MethodSchemaContext.Provider value={ORDER_METHOD}>
                      <ViewSchemaContext.Provider
                        value={{
                          viewSchema: ORDER_SHOW_VIEW,
                          methodSchema: ORDER_METHOD,
                          resource: ORDERS_RESOURCE,
                        }}
                      >
                        <Box sx={{maxWidth: 860, mx: 'auto', p: 3}}>
                          <Typography variant="h6" sx={{mb: 0.5}}>
                            {title}
                          </Typography>
                          <Divider sx={{mb: 2}} />
                          <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                            {children}
                          </Box>
                        </Box>
                      </ViewSchemaContext.Provider>
                    </MethodSchemaContext.Provider>
                  </LocalResourceSchemaProvider>
                </RecordContextProvider>
              </ResourceContextProvider>
            </SchemaRootContext.Provider>
          </StoryAdminConfigProvider>
        </TabsLocationProvider>
      </LocaleProvider>
    </CoreAdminContext>
  </TestMemoryRouter>
);

type ShowcaseProps = {title: string; boxes: BoxSchema[]};

// Renders schema boxes through the normal SchemaBox → defaultBoxProvider path; the box `label` doubles
// as the caption.
const BoxShowcase = ({title, boxes}: ShowcaseProps) => (
  <ShowcaseShell title={title}>
    {boxes.map((box) => (
      <SchemaBox key={box.name} schema={box} isRoot />
    ))}
  </ShowcaseShell>
);

const meta: Meta<typeof BoxShowcase> = {
  title: 'schema/boxes/BoxActions',
  component: BoxShowcase,
  parameters: {layout: 'fullscreen'},
};

export default meta;

type Story = StoryObj<typeof BoxShowcase>;

/**
 * `SchemaListBox` — one box per configuration, stacked, with **no story-injected defaults**: the
 * builder only wires the box to the `items` reference, so everything you see is the library's own
 * behaviour. Rows show **Detail / Upravit** (the row slot's `DefaultActions(scope=detail)`); the
 * datagrid toolbar shows only what `list.list_actions` names. What varies is the header slot:
 *
 * 1. **`box.toolbar_actions: [create, export]` referencing `items`** → renders in the header.
 * 2. **`box.toolbar_actions: [export]`** → **dropped**, header empty — the *same* action without a
 *    reference resolves against the parent order, which has no `export`. Boxes 1 vs 2 are the lesson.
 * 3. **`box.toolbar_actions: [edit]`** → renders **Upravit objednávku** — a box action *does* show when
 *    it names a real parent (order) action.
 * 4. **`box.toolbar_actions: [inline]`** → renders **Sdílet** — an inline action always resolves.
 */
export const ListBox: Story = {
  render: () => (
    <BoxShowcase
      title="SchemaListBox — toolbar action placement"
      boxes={[
        itemsListBox(
          'list_toolbar',
          '1) box.toolbar_actions: [create, export] referencing items → renders in header',
          {toolbarActions: ITEMS_HEADER_ACTIONS, list: {listActions: []}}
        ),
        itemsListBox(
          'box_toolbar',
          '2) box.toolbar_actions: [export] → dropped (box slot resolves against the order)',
          {toolbarActions: [{name: 'export'}], list: {listActions: []}}
        ),
        itemsListBox(
          'box_toolbar_parent',
          '3) box.toolbar_actions: [edit] → renders (edit is a real order action)',
          {toolbarActions: [{name: 'edit'}], list: {listActions: []}}
        ),
        itemsListBox(
          'box_toolbar_inline',
          '4) box.toolbar_actions: inline action → always renders',
          {
            toolbarActions: [inlineAction],
            list: {listActions: []},
          }
        ),
        itemsListBox(
          'list_actions_default',
          '5) list_actions: DefaultActions(scope=list) → the collection defaults (create)',
          {list: {listActions: [{type: 'default_actions', scope: 'list'}]}}
        ),
        itemsListBox(
          'list_actions_custom',
          '6) list_actions: [create, export] → renders in datagrid',
          {
            list: {
              listActions: [{name: 'create'}, {name: 'export'}],
            },
          } as unknown as Partial<BoxSchema>
        ),
        itemsListBox('list_actions_inline', '7) list_actions: [share] → renders in datagrid', {
          list: {
            listActions: [inlineAction],
          },
        } as unknown as Partial<BoxSchema>),
      ]}
    />
  ),
};

/**
 * `SchemaSimpleBox` — a simple box has only the one header slot, resolved against the box's own
 * (parent) record. No datagrid to muddy the picture, so the resolution rule shows plainly:
 *
 * 1. **`{name: 'edit'}`** → renders (`edit` *is* an order record action).
 * 2. **`{name: 'create'}`** → dropped (`create` is not an order record action).
 * 3. **inline action** → always renders.
 * 4. **no `toolbar_actions`** → header shows just the title.
 */
export const SimpleBox: Story = {
  render: () => (
    <BoxShowcase
      title="SchemaSimpleBox — toolbar action placement"
      boxes={[
        orderSummaryBox(
          'simple_edit',
          '1) box.toolbar_actions: [edit] → renders (edit is an order action)',
          [{name: 'edit'}]
        ),
        orderSummaryBox(
          'simple_create',
          '2) box.toolbar_actions: [create] → dropped (not an order action)',
          [{name: 'create'}]
        ),
        orderSummaryBox('simple_inline', '3) box.toolbar_actions: inline action → always renders', [
          inlineAction,
        ]),
        orderSummaryBox('simple_none', '4) no toolbar_actions → header is just the title'),
      ]}
    />
  ),
};

/**
 * `SchemaTabBox` — the toolbar actions of a tab box land in one of two places, and the difference is
 * the whole lesson:
 *
 * - **Card-less** (no `label`, or `card: false`): there is no card header, so the toolbar sits in the
 *   tab strip's **own header** — to the right of the tabs, flush to the edge.
 * - **With a `label`**: the box draws a card, and the toolbar moves into the **card header** like on
 *   every other box, the tabs below it.
 *
 * Either way the buttons are **small**, consistent with every box header.
 *
 * The action-resolution rule is the simple-box one: `toolbar_actions` resolve against the **parent**
 * order record, so `edit` (a real order action) and any inline action render, while a bare
 * `{name: 'create'}` would be dropped.
 *
 * 1. **card-less + `[edit]`** → buttons pinned right in the tab strip.
 * 2. **card-less + inline action** → always renders, same placement.
 * 3. **with a label** → a card; the toolbar moves into the card header.
 * 4. **card-less, no actions** → just the tab strip.
 * 5. **`tab.show_toolbar_navigation: true`** → Prev/Next buttons in a footer below the panels. This is
 *    a separate, opt-in slot from the toolbar actions above (default `false` on a tab box, unlike a
 *    wizard where it is on by default).
 */
export const TabBox: Story = {
  render: () => (
    <ShowcaseShell title="SchemaTabBox — toolbar action placement">
      {[
        {
          caption:
            '1) card-less + box.toolbar_actions: [edit] → buttons flush right in the tab strip',
          schema: detailTabBox('tab_edit', {card: false, toolbarActions: [{name: 'edit'}]}),
        },
        {
          caption: '2) card-less + inline action → always renders (same placement)',
          schema: detailTabBox('tab_inline', {card: false, toolbarActions: [inlineAction]}),
        },
        {
          caption:
            '3) with a label → a card; the toolbar moves into the card header (small buttons)',
          schema: detailTabBox('tab_card', {
            label: 'Detail objednávky',
            toolbarActions: [inlineAction],
          }),
        },
        {
          caption: '4) card-less, no toolbar_actions → just the tab strip',
          schema: detailTabBox('tab_plain', {card: false}),
        },
        {
          caption:
            '5) tab.show_toolbar_navigation: true → Prev/Next buttons in the footer below the panels (opt-in; off by default on a tab box)',
          schema: detailTabBox('tab_nav', {
            card: false,
            tab: {showToolbarNavigation: true},
          }),
        },
      ].map(({caption, schema}) => (
        <Box key={schema.name}>
          <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
            {caption}
          </Typography>
          <SchemaBox schema={schema} isRoot />
        </Box>
      ))}
    </ShowcaseShell>
  ),
};

/**
 * `SchemaWizardBox` — the wizard walks the same steps one at a time with a `Stepper` and Prev/Next
 * navigation. It shares the tab box's header treatment (the `NavigationHeader` design molecule), so its
 * action slots land the same way:
 *
 * - **`box.toolbar_actions`** resolve against the **parent** order (like a simple/tab box) and render
 *   in the stepper's own header — **card-less** → next to the stepper, flush right; **with a `label`**
 *   → the **card header**. Either way **small** buttons, consistent with every box header.
 * - **`box.bottom_actions`** and the **Prev/Next** navigation (`showToolbarNavigation`, on by default)
 *   render in the footer below the steps. A `Save` typically lives in one of these two slots.
 *
 * The showcase mounts a record, so the wizard reads as an **edit view**: every step is reachable and
 * a bottom action shows on every step (in a create view it would appear only on the last step).
 *
 * 1. **card-less + `toolbar_actions: [edit]`** → buttons flush right in the stepper header;
 *    Prev/Next in the footer.
 * 2. **card-less + inline action** → always renders, same placement.
 * 3. **with a `label`** → a card; the toolbar moves into the card header.
 * 4. **card-less + `bottom_actions: [inline]`** → renders in the footer beside Prev/Next.
 */
export const WizardBox: Story = {
  render: () => (
    <ShowcaseShell title="SchemaWizardBox — toolbar action placement">
      {[
        {
          caption:
            '1) card-less + box.toolbar_actions: [edit] → buttons flush right in the stepper header; Prev/Next in the footer',
          schema: detailWizardBox('wizard_edit', {card: false, toolbarActions: [{name: 'edit'}]}),
        },
        {
          caption: '2) card-less + inline action → always renders (same placement)',
          schema: detailWizardBox('wizard_inline', {card: false, toolbarActions: [inlineAction]}),
        },
        {
          caption:
            '3) with a label → a card; the toolbar moves into the card header (small buttons)',
          schema: detailWizardBox('wizard_card', {
            label: 'Průvodce objednávkou',
            toolbarActions: [inlineAction],
          }),
        },
        {
          caption:
            '4) card-less + box.bottom_actions: [inline] → in the footer beside Prev/Next (edit view → every step)',
          schema: detailWizardBox('wizard_bottom', {card: false, bottomActions: [inlineAction]}),
        },
      ].map(({caption, schema}) => (
        <Box key={schema.name}>
          <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
            {caption}
          </Typography>
          <SchemaBox schema={schema} isRoot />
        </Box>
      ))}
    </ShowcaseShell>
  ),
};

/**
 * `SchemaImagesBox` — a mirror of the `ListBox` story, rendered directly (there is no `images`
 * `BoxType`, so `SchemaBox`/`defaultBoxProvider` would not route to it). Same slots and same
 * resolution rules as the list box — the content is an image grid instead of a datagrid, and the
 * list/config toolbar (`SchemaImagesBoxActions`) sits above it. The `label` doubles as the caption.
 *
 * 1. **`box.toolbar_actions: [create, export]` referencing `items`** → renders in the header.
 * 2. **`box.toolbar_actions: [export]`** → **dropped** (without a reference it resolves against the order).
 * 3. **`box.toolbar_actions: [edit]`** → renders **Upravit objednávku** (a real order action).
 * 4. **`box.toolbar_actions: [inline]`** → renders **Sdílet** (an inline action always resolves).
 * 5-7. **`list_actions`** (`DefaultActions` / custom / inline) → render in the images toolbar.
 */
export const ImagesBox: Story = {
  render: () => (
    <ShowcaseShell title="SchemaImagesBox — toolbar action placement">
      {[
        imagesBox(
          'img_list_toolbar',
          '1) box.toolbar_actions: [create, export] referencing items → renders in header',
          {
            toolbarActions: ITEMS_HEADER_ACTIONS,
            list: {listActions: []},
          }
        ),
        imagesBox(
          'img_box_toolbar',
          '2) box.toolbar_actions: [export] → dropped (resolves against the order)',
          {
            toolbarActions: [{name: 'export'}],
            list: {listActions: []},
          }
        ),
        imagesBox(
          'img_box_toolbar_parent',
          '3) box.toolbar_actions: [edit] → renders (edit is a real order action)',
          {
            toolbarActions: [{name: 'edit'}],
            list: {listActions: []},
          }
        ),
        imagesBox(
          'img_box_toolbar_inline',
          '4) box.toolbar_actions: inline action → always renders',
          {
            toolbarActions: [inlineAction],
            list: {listActions: []},
          }
        ),
        imagesBox(
          'img_list_actions_default',
          '5) list_actions: DefaultActions(scope=list) → the collection defaults (create)',
          {list: {listActions: [{type: 'default_actions', scope: 'list'}]}}
        ),
        imagesBox(
          'img_list_actions_custom',
          '6) list_actions: [create, export] → renders in the images toolbar',
          {
            list: {listActions: [{name: 'create'}, {name: 'export'}]},
          }
        ),
        imagesBox(
          'img_list_actions_inline',
          '7) list_actions: [share] → renders in the images toolbar',
          {
            list: {listActions: [inlineAction]},
          }
        ),
      ].map((box) => (
        <SchemaImagesBox key={box.name} schema={box} isRoot />
      ))}
    </ShowcaseShell>
  ),
};
