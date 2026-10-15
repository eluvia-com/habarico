// Story-support fixtures for the schema-layer COMPONENT stories (HAB-878). NOT exported from the
// `@schema` barrel and never shipped in the library.
//
// The counterpart of `schema/pages/_data.ts`, deliberately **piece-shaped** rather than page-shaped:
// `pages/_data.ts` exists to boot a whole `SchemaAdmin`, so everything it exposes is wrapped in a
// complete `SchemaProvider`. A component story needs the opposite — the individual *fragments*
// (one `FieldSchema`, one `BoxSchema`, one `ActionSchema`) it can hand straight to the component
// under test, plus the smallest resource schema that makes a reference resolve.
//
// The domain is the e-shop the documentation pages already use (`Product`, `Category`, `Order`,
// `Customer` — see `node/docs/box-components/*`, which spell out `Box(label="Product", …)`), so a
// story embedded in a page shows the same entities as the code sample printed above it.
import fakeDataProvider from 'ra-data-fakerest';
import type {Identifier} from 'react-admin';
import type {ServiceAuthProvider} from '@admin/providers/types';
import type {SchemaProvider, ServiceDataProvider} from '@schema/providers/types';
import type {
  ActionDescriptor,
  BoxItem,
  BoxSchema,
  EndpointsSchema,
  FieldDescriptor,
  FieldSchema,
  GlobalResourceActionSchema,
  GlobalResourceSchema,
  GlobalViewSchema,
  HabRecord,
  LocalResourceSchema,
  MethodSchema,
  ResourceActionSchema,
  ServiceSchema,
  ServicesSchema,
  ViewActionParameters,
  ViewSchema,
} from '@schema/types';
import type {ServiceConfigMap} from '@typing';

// ----------------------------------------------------------------------------
// Service identity
// ----------------------------------------------------------------------------

export const SERVICE_NAME = 'shop';
export const SERVICE_URL = 'https://mock.habarico.test/shop';

export const PRODUCTS_RESOURCE = `${SERVICE_NAME}/products`;
export const CATEGORIES_RESOURCE = `${SERVICE_NAME}/categories`;

export const PRODUCTS_URL = `${SERVICE_URL}/products/`;
export const CATEGORIES_URL = `${SERVICE_URL}/categories/`;

export const SERVICE_CONFIG_MAP: ServiceConfigMap = {[SERVICE_NAME]: {url: SERVICE_URL}};

// ----------------------------------------------------------------------------
// Schema authoring helpers — the vocabulary a story builds its fragments from.
// ----------------------------------------------------------------------------

/** A field descriptor (a box leaf). */
export const fd = (name: string, extra: Partial<FieldDescriptor> = {}): FieldDescriptor => ({
  type: 'field',
  name,
  ...extra,
});

/** A box schema with the defaults a story almost always wants. */
export const box = (schema: Partial<BoxSchema> & Pick<BoxSchema, 'name' | 'type'>): BoxSchema => ({
  readOnly: false,
  ...schema,
});

/**
 * Wraps a box in a bare, card-less root box, so the demonstrated box renders *nested* — exactly as
 * it would inside a real detail layout, where only the view's root box may take a card.
 */
export const rootWrap = (name: string, inner: BoxSchema): BoxSchema => ({
  name: `${name}_root`,
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [inner],
});

/**
 * A plain redirect view target. `choices: []` is truthy and would turn a button into a
 * (choice-less, invisible) split button, so it is deliberately omitted via the cast.
 */
export const redirectView = (name: string): ViewActionParameters =>
  ({name, mode: 'redirect', parameters: {}}) as ViewActionParameters;

/** The same field list on every endpoint — a story never exercises per-method field differences. */
export const endpointsOf = (fields: FieldSchema[]): EndpointsSchema => ({
  get: {fields},
  post: {fields},
  put: {fields},
  patch: {fields: []},
  delete: {fields: []},
});

/** An inline SVG data URI, so image fields render offline (stories have no network). */
export const svgImage = (label: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="${color}"/><text x="80" y="66" fill="#fff" font-family="sans-serif" font-size="13" text-anchor="middle">${label}</text></svg>`;
  return {url: `data:image/svg+xml,${encodeURIComponent(svg)}`, filename: `${label}.svg`};
};

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export const PRODUCT_STATUSES = [
  {value: 'draft', label: 'Draft', color: 'secondary' as const},
  {value: 'published', label: 'Published', color: 'success' as const},
  {value: 'archived', label: 'Archived', color: 'error' as const},
];

export const PRODUCT_TAGS = [
  {value: 'sale', label: 'On sale', color: 'warning' as const},
  {value: 'new', label: 'New arrival', color: 'info' as const},
  {value: 'bestseller', label: 'Bestseller', color: 'success' as const},
];

// ----------------------------------------------------------------------------
// Records
// ----------------------------------------------------------------------------

export type Category = {id: number; name: string; parent_id?: number | null};

export const CATEGORIES: Category[] = [
  {id: 1, name: 'Peripherals', parent_id: null},
  {id: 2, name: 'Keyboards', parent_id: 1},
  {id: 3, name: 'Displays', parent_id: null},
];

export type Product = {
  id: number;
  category_id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  status: string;
  tags: string[];
  released_on: string;
  updated_at: string;
  support_email: string;
  website: string;
  phone: string;
  photo: {url: string; filename: string};
  dimensions: {width: number; height: number; depth: number};
  price_range: {lower: number; upper: number};
  variants: {sku: string; size: string; stock: number}[];
  related_category_ids: number[];
};

export const PRODUCTS: Product[] = [
  {
    id: 1,
    category_id: 1,
    name: 'Mechanical Keyboard K2',
    sku: 'KB-K2-001',
    description: 'A compact 75% mechanical keyboard with hot-swappable switches.',
    price: 129.5,
    stock: 42,
    active: true,
    status: 'published',
    tags: ['bestseller', 'new'],
    released_on: '2026-02-17',
    updated_at: '2026-09-14T09:30:00Z',
    support_email: 'support@example.com',
    website: 'https://example.com/k2',
    phone: '+420123456789',
    photo: svgImage('Keyboard', '#2f6f6f'),
    dimensions: {width: 32, height: 4, depth: 14},
    price_range: {lower: 99, upper: 149},
    related_category_ids: [2, 3],
    variants: [
      {sku: 'KB-K2-001-BRN', size: 'Brown switch', stock: 18},
      {sku: 'KB-K2-001-RED', size: 'Red switch', stock: 24},
    ],
  },
  {
    id: 2,
    category_id: 3,
    name: 'Studio Display 27"',
    sku: 'DS-27-014',
    description: 'A 27-inch 5K display with a matte coating.',
    price: 1499,
    stock: 6,
    active: false,
    status: 'draft',
    tags: ['sale'],
    released_on: '2025-11-03',
    updated_at: '2026-08-30T16:05:00Z',
    support_email: 'displays@example.com',
    website: 'https://example.com/studio-27',
    phone: '+420987654321',
    photo: svgImage('Display', '#3f7fae'),
    dimensions: {width: 62, height: 40, depth: 17},
    price_range: {lower: 1299, upper: 1699},
    related_category_ids: [1],
    variants: [{sku: 'DS-27-014-STD', size: 'Standard glass', stock: 6}],
  },
  {
    id: 3,
    category_id: 1,
    name: 'Wireless Mouse M5',
    sku: 'MS-M5-007',
    description: 'A lightweight wireless mouse with a silent click.',
    price: 49,
    stock: 0,
    active: true,
    status: 'archived',
    tags: [],
    released_on: '2024-06-21',
    updated_at: '2026-07-11T11:45:00Z',
    support_email: 'support@example.com',
    website: 'https://example.com/m5',
    phone: '+420555000111',
    photo: svgImage('Mouse', '#8a5fae'),
    dimensions: {width: 6, height: 4, depth: 11},
    price_range: {lower: 39, upper: 59},
    related_category_ids: [],
    variants: [],
  },
];

// ----------------------------------------------------------------------------
// Field schemas — one per (type, format) pair the default providers dispatch on, so the
// `SchemaField` / `SchemaInput` matrices can be built by picking names off this list.
// ----------------------------------------------------------------------------

export const PRODUCT_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'name', type: 'string', format: 'text', label: 'Name', required: true, sortable: true},
  {name: 'sku', type: 'string', label: 'SKU', helpText: 'Stock keeping unit.'},
  {name: 'description', type: 'string', format: 'rich-text', label: 'Description'},
  {name: 'price', type: 'number', format: 'decimal', label: 'Price', options: {postfix: ' €'}},
  {name: 'stock', type: 'integer', label: 'In stock'},
  {name: 'active', type: 'boolean', label: 'Active'},
  {name: 'status', type: 'string', format: 'choices', label: 'Status', enum: PRODUCT_STATUSES},
  {
    name: 'category_id',
    type: 'integer',
    format: 'relation',
    label: 'Category',
    reference: CATEGORIES_RESOURCE,
  },
  {
    name: 'tags',
    type: 'array',
    label: 'Tags',
    items: {name: 'tags', type: 'string', enum: PRODUCT_TAGS},
  },
  {name: 'released_on', type: 'string', format: 'date', label: 'Released on'},
  {name: 'updated_at', type: 'string', format: 'date-time', label: 'Last update'},
  {name: 'support_email', type: 'string', format: 'email', label: 'Support e-mail'},
  {name: 'website', type: 'string', format: 'url', label: 'Website'},
  {name: 'phone', type: 'string', format: 'phone', label: 'Phone'},
  {name: 'photo', type: 'object', format: 'base64-image', label: 'Photo'},
  {
    name: 'dimensions',
    type: 'object',
    label: 'Dimensions',
    properties: [
      {name: 'width', type: 'integer', label: 'Width'},
      {name: 'height', type: 'integer', label: 'Height'},
      {name: 'depth', type: 'integer', label: 'Depth'},
    ],
  },
  {
    name: 'price_range',
    type: 'object',
    format: 'range',
    label: 'Price range',
    properties: [
      {name: 'lower', type: 'number', format: 'decimal', label: 'From'},
      {name: 'upper', type: 'number', format: 'decimal', label: 'To'},
    ],
  },
  {
    name: 'related_category_ids',
    type: 'array',
    label: 'Related categories',
    items: {
      name: 'related_category_ids',
      type: 'integer',
      format: 'relation',
      reference: CATEGORIES_RESOURCE,
    },
  },
  {
    name: 'variants',
    type: 'array',
    label: 'Variants',
    items: {
      name: 'variants',
      type: 'object',
      properties: [
        {name: 'sku', type: 'string', label: 'SKU'},
        {name: 'size', type: 'string', label: 'Variant'},
        {name: 'stock', type: 'integer', label: 'In stock'},
      ],
    },
  },
];

export const CATEGORY_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'name', type: 'string', format: 'text', label: 'Name', sortable: true},
  {
    name: 'parent_id',
    type: 'integer',
    format: 'tree-relation',
    label: 'Parent category',
    reference: CATEGORIES_RESOURCE,
  },
];

/** Look one field up by name — the matrices and per-field stories index into the list with it. */
export const productField = (name: string): FieldSchema => {
  const schema = PRODUCT_FIELDS.find((field) => field.name === name);
  if (!schema) throw new Error(`No mock product field named "${name}"`);
  return schema;
};

export const PRODUCT_METHOD: MethodSchema = {fields: PRODUCT_FIELDS};
export const CATEGORY_METHOD: MethodSchema = {fields: CATEGORY_FIELDS};

// ----------------------------------------------------------------------------
// Actions & views
// ----------------------------------------------------------------------------

export const PRODUCT_ACTIONS: ResourceActionSchema[] = [
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
    showInDetail: true,
    label: 'Edit',
    icon: 'Edit',
    view: redirectView('edit'),
  },
  {
    name: 'create',
    type: 'view',
    isDetail: false,
    showInList: true,
    showInDetail: false,
    label: 'New product',
    icon: 'Add',
    view: redirectView('create'),
  },
  {
    name: 'archive',
    type: 'resource',
    isDetail: true,
    showInList: false,
    showInDetail: true,
    label: 'Archive',
    icon: 'Archive',
    confirmDialog: {title: 'Archive this product?', message: 'It disappears from the shop.'},
    resource: {endpoint: {method: 'post', actionName: 'archive'}, data: {}},
  },
];

export const PRODUCT_VIEWS: ViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}, list: {}},
  {name: 'show', type: 'show', isDetail: true, label: 'Product', endpoint: {method: 'get'}},
  {name: 'edit', type: 'edit', isDetail: true, label: 'Edit product', endpoint: {method: 'put'}},
  {
    name: 'create',
    type: 'create',
    isDetail: false,
    label: 'New product',
    endpoint: {method: 'post'},
  },
];

export const CATEGORY_ACTIONS: ResourceActionSchema[] = [
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
];

export const CATEGORY_VIEWS: ViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}, list: {}},
  {name: 'show', type: 'show', isDetail: true, label: 'Category', endpoint: {method: 'get'}},
];

// ----------------------------------------------------------------------------
// Resource schemas
// ----------------------------------------------------------------------------

export const PRODUCT_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'products',
  pkFieldName: 'id',
  url: PRODUCTS_URL,
  actions: PRODUCT_ACTIONS,
  endpoints: endpointsOf(PRODUCT_FIELDS),
  views: PRODUCT_VIEWS,
};

export const CATEGORY_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'categories',
  pkFieldName: 'id',
  url: CATEGORIES_URL,
  actions: CATEGORY_ACTIONS,
  endpoints: endpointsOf(CATEGORY_FIELDS),
  views: CATEGORY_VIEWS,
};

const toGlobalActions = (actions: ResourceActionSchema[]): GlobalResourceActionSchema[] =>
  actions.map(({name, type, isDetail, showInList, showInDetail}) => ({
    name,
    type,
    isDetail,
    showInList,
    showInDetail,
  }));

const toGlobalViews = (views: ViewSchema[]): GlobalViewSchema[] =>
  views.map(({name, type, isDetail, endpoint}) => ({name, type, isDetail, endpoint}));

export const SERVICE_SCHEMA: ServiceSchema = [
  {
    name: 'products',
    pkFieldName: 'id',
    label: 'Products',
    url: PRODUCTS_URL,
    views: toGlobalViews(PRODUCT_VIEWS),
    actions: toGlobalActions(PRODUCT_ACTIONS),
  } satisfies GlobalResourceSchema,
  {
    name: 'categories',
    pkFieldName: 'id',
    label: 'Categories',
    url: CATEGORIES_URL,
    views: toGlobalViews(CATEGORY_VIEWS),
    actions: toGlobalActions(CATEGORY_ACTIONS),
  } satisfies GlobalResourceSchema,
];

export const SERVICES_SCHEMA = {[SERVICE_NAME]: SERVICE_SCHEMA} as ServicesSchema;

// ----------------------------------------------------------------------------
// Records as the data provider returns them — every record carries its `meta` sidecar.
// ----------------------------------------------------------------------------

const ACTIONS_BY_RESOURCE: Record<string, ResourceActionSchema[]> = {
  [PRODUCTS_RESOURCE]: PRODUCT_ACTIONS,
  [CATEGORIES_RESOURCE]: CATEGORY_ACTIONS,
};

/** Adds the `meta` sidecar (per-record schema + `repr`) that every `HabRecord` carries at runtime. */
export const habRecord = (
  resource: string,
  record: Record<string, unknown> & {id: Identifier}
): HabRecord => ({
  ...record,
  meta: {
    schema: {
      name: resource.split('/')[1] ?? resource,
      pkFieldName: 'id',
      actions: ACTIONS_BY_RESOURCE[resource] ?? [],
    },
    repr: String(record.name ?? record.sku ?? record.id ?? ''),
    tags: [],
  },
});

/** The first product, decorated — the ambient record most read-side stories mount on. */
export const PRODUCT_RECORD = habRecord(PRODUCTS_RESOURCE, PRODUCTS[0]);

/**
 * The first category, decorated — the parent record a *collection* box mounts on. A list or gallery
 * box needs a one-to-many to point at, and `products.category_id → categories` is the fixture's.
 */
export const CATEGORY_RECORD = habRecord(CATEGORIES_RESOURCE, CATEGORIES[0]);

// ----------------------------------------------------------------------------
// Mock providers
// ----------------------------------------------------------------------------

const RESOURCE_SCHEMA_BY_URL: Record<string, LocalResourceSchema> = {
  [PRODUCTS_URL]: PRODUCT_RESOURCE_SCHEMA,
  [CATEGORIES_URL]: CATEGORY_RESOURCE_SCHEMA,
};

export const mockSchemaProvider: SchemaProvider = {
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

/**
 * An in-memory data provider over the fixtures above, with every returned record decorated into a
 * `HabRecord`. Built fresh per call so a story that writes starts from clean data.
 */
export const createMockDataProvider = (): ServiceDataProvider => {
  const base = fakeDataProvider(
    {
      [PRODUCTS_RESOURCE]: PRODUCTS.map((product) => ({...product})),
      [CATEGORIES_RESOURCE]: CATEGORIES.map((category) => ({...category})),
    },
    false
  );
  const mapList = async <T extends {data: (Record<string, unknown> & {id: Identifier})[]}>(
    resource: string,
    promise: Promise<T>
  ) => {
    const result = await promise;
    return {...result, data: result.data.map((record) => habRecord(resource, record))};
  };
  const mapOne = async <T extends {data: Record<string, unknown> & {id: Identifier}}>(
    resource: string,
    promise: Promise<T>
  ) => {
    const result = await promise;
    return {...result, data: habRecord(resource, result.data)};
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
    callAction: () => Promise.resolve({data: {meta: {state: 'success', message: 'Done'}}}),
    export: (resource, params) =>
      Promise.resolve({
        status: 200,
        blob: new Blob(['id\n1\n'], {type: 'text/csv'}),
        filename: `${resource.replace('/', '_')}.${params.format}`,
      }),
  } as ServiceDataProvider;
};

export const mockAuthProvider: ServiceAuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({id: 1, fullName: 'Alex Carter'}),
  resetPassword: () => Promise.resolve(),
  setPassword: () => Promise.resolve(new Response()),
  isAuthenticated: () => true,
  updateIdentity: () => Promise.resolve(new Response()),
  changePassword: () => Promise.resolve(),
  verifyMfa: () => Promise.resolve(new Response()),
  requestMfaChallenge: () => Promise.resolve({} as never),
  getAuthHeaders: () => ({}),
};

// ----------------------------------------------------------------------------
// Common box fragments reused across the box stories.
// ----------------------------------------------------------------------------

/** The three fields a box story shows when the box's own configuration is the point. */
export const SUMMARY_FIELDS: BoxItem[] = [fd('name'), fd('sku'), fd('price')];

/** An inline action — one that carries its own `action` and therefore always resolves. */
export const INLINE_ACTION: ActionDescriptor = {
  name: 'box_action',
  label: 'Share',
  icon: 'Share',
  action: {type: 'view', isDetail: false, view: redirectView('show')},
};
