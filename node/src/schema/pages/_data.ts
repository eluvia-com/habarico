import fakeDataProvider from 'ra-data-fakerest';
import type {DataProvider} from 'react-admin';
import type {ServiceAuthProvider} from '@admin/providers/types';
import type {SchemaProvider, ServiceDataProvider} from '@schema/providers/types';
import type {
  ActionDescriptor,
  AnyActionDescriptor,
  BoxSchema,
  EndpointsSchema,
  EnumType,
  FieldSchema,
  FilterSchema,
  GlobalResourceActionSchema,
  GlobalResourceSchema,
  GlobalViewSchema,
  GridItemBoxParameters,
  HabRecord,
  LocalResourceSchema,
  MenuSchema,
  RecordMeta,
  ResourceActionSchema,
  ResourceReference,
  ServiceSchema,
  ServicesSchema,
  ViewActionParameters,
} from '@schema/types';
import type {AdminLanguage, FieldDescriptor, FilterDescriptor} from '@typing';

/**
 * Story-support fixtures + mock providers for the **schema-layer** page harness (HAB-687). This is
 * the schema-layer analogue of `admin/pages/_data.ts`: where the admin harness seeds a raw
 * `ra-data-fakerest` provider, this one additionally hand-authors the **backend schema** the schema
 * layer reads (`ServiceSchema` + per-resource `LocalResourceSchema`) so the whole admin UI can be
 * generated from a mock — no live backend.
 *
 * Deliberately self-contained: it shares nothing with `admin/pages` / `design/pages` (its own copy
 * of the property/owners domain, its own languages and providers). A little duplication keeps each
 * layer's "runs on its own" story independent.
 */

// ----------------------------------------------------------------------------
// Service identity — one mock backend service ("estates") with four resources.
// The react-admin resource name is `${service}/${resource}` (see useResourceElements), so routes
// are `/estates/properties`, `/estates/properties/1/show`, etc.
// ----------------------------------------------------------------------------

export const SERVICE_NAME = 'estates';
export const SERVICE_URL = 'https://mock.habarico.test/estates';

export const PROPERTIES_RESOURCE = `${SERVICE_NAME}/properties`;
export const OWNERS_RESOURCE = `${SERVICE_NAME}/owners`;
export const DOCUMENTS_RESOURCE = `${SERVICE_NAME}/documents`;
export const PAYMENTS_RESOURCE = `${SERVICE_NAME}/payments`;
// Photos back the property gallery box; not a menu resource (no `menu`), only referenced by url.
export const PHOTOS_RESOURCE = `${SERVICE_NAME}/photos`;

// The address a schema of this service gives one of its resources.
const referenceTo = (
  resource: string,
  parts: Partial<ResourceReference> = {}
): ResourceReference => {
  const [service, name] = resource.split('/');
  return {service, resource: name, ...parts};
};

const PROPERTIES_URL = `${SERVICE_URL}/properties/`;
const OWNERS_URL = `${SERVICE_URL}/owners/`;
const DOCUMENTS_URL = `${SERVICE_URL}/documents/`;
const PAYMENTS_URL = `${SERVICE_URL}/payments/`;
const PHOTOS_URL = `${SERVICE_URL}/photos/`;

// ----------------------------------------------------------------------------
// Languages — the harness offers Czech (primary) and English so the story can exercise the language
// switch. Two entries make SchemaAdmin render the language picker; switching locale refetches the
// service + record schemas *and* the data endpoints with the new `meta.locale`, and the locale-aware
// `mockSchemaProvider` / `decorate` below return English labels for `en` (see `localizeSchema` /
// `LABELS_EN`) — so the per-record `meta.schema.actions` (row-action / detail-toolbar labels) follow
// the language too (HAB-782). React Admin's own built-in strings switch via the polyglot provider
// (`messages` ships both `cs` and `en`).
// ----------------------------------------------------------------------------

export const LANGUAGES: AdminLanguage[] = [
  {title: 'Čeština', locale: 'cs-CZ'},
  {title: 'English', locale: 'en-GB'},
];

// ----------------------------------------------------------------------------
// Domain fixtures — property-management flavour (own copy for parity with admin/design).
// ----------------------------------------------------------------------------

export type Owner = {
  id: number;
  first_name: string;
  surname: string;
  full_name: string;
  email: string;
  phone: string;
};

export type BuildingNumber = {number: string; kind: string};
export type Parcel = {parcel_number: string; parcel_area: number; parcel_type: string};
// HAB-837 coverage: item shape for the `equipment` choices array (`SchemaChoicesArrayBox`) — one
// row per `equipment_type` enum value, `note` is only meaningful for the free "Jiné" rows.
export type Equipment = {equipment_type: string; note?: string};

export type Property = {
  id: number;
  type: string;
  address: string;
  layout: string;
  area: number;
  owner_id: number;
  involvement: string;
  complete: boolean;
  active: boolean;
  residential: boolean;
  unit_number: string;
  floor_number: number;
  floor_count: number;
  barrier_free: boolean;
  heating: string;
  note: string;
  cadastral_area: string;
  gps_lat: number;
  gps_lng: number;
  // Nested object — backs the `object` detail box (Kontakt tab). Injected in the mock data seed
  // (see createMockDataProviderFactory) rather than hand-written on every fixture, hence optional.
  contact?: {email: string; phone: string};
  // Backs the "Bankovní účet" simple box on the Vlastníci tab. Injected in the mock data seed too.
  bank_account?: string;
  building_numbers: BuildingNumber[];
  parcels: Parcel[];
  equipment: Equipment[];
};

export const OWNERS: Owner[] = [
  {
    id: 1,
    first_name: 'Jiří',
    surname: 'Daněk',
    full_name: 'Jiří Daněk',
    email: 'jiri.danek@example.com',
    phone: '+420 601 111 222',
  },
  {
    id: 2,
    first_name: 'Eva',
    surname: 'Vohralíková',
    full_name: 'Eva Vohralíková',
    email: 'eva.v@example.com',
    phone: '+420 602 333 444',
  },
  {
    id: 3,
    first_name: 'Gabriela',
    surname: 'Bendová',
    full_name: 'Gabriela Bendová',
    email: 'gabriela.b@example.com',
    phone: '+420 603 555 666',
  },
  {
    id: 4,
    first_name: 'Jan',
    surname: 'Mareš',
    full_name: 'Ing. Jan Mareš',
    email: 'jan.mares@example.com',
    phone: '+420 604 777 888',
  },
  {
    id: 5,
    first_name: 'Miroslav',
    surname: 'Bureš',
    full_name: 'Miroslav Bureš',
    email: 'm.bures@example.com',
    phone: '+420 605 999 000',
  },
  {
    id: 6,
    first_name: 'Petra',
    surname: 'Nováková',
    full_name: 'Petra Nováková',
    email: 'petra.n@example.com',
    phone: '+420 606 121 314',
  },
];

export const PROPERTIES: Property[] = [
  {
    id: 1,
    type: 'Byt',
    address: 'Kyjovská 578/13, Praha – Michle',
    layout: '2 + 1',
    area: 52,
    owner_id: 1,
    involvement: 'Pronájem a správa',
    complete: true,
    active: true,
    residential: true,
    unit_number: '578/13',
    floor_number: 3,
    floor_count: 6,
    barrier_free: false,
    heating: 'Dálkové',
    note: '',
    cadastral_area: 'Michle',
    gps_lat: 50.0512,
    gps_lng: 14.463,
    building_numbers: [
      {number: '578', kind: 'Popisné'},
      {number: '13', kind: 'Orientační'},
    ],
    parcels: [
      {parcel_number: '1234/5', parcel_area: 210, parcel_type: 'Zastavěná plocha'},
      {parcel_number: '1234/6', parcel_area: 80, parcel_type: 'Zahrada'},
    ],
    equipment: [
      {equipment_type: 'Klimatizace'},
      {equipment_type: 'Výtah'},
      {equipment_type: 'Jiné', note: 'Sklep'},
    ],
  },
  {
    id: 2,
    type: 'Dům',
    address: 'Karla Čapka 841, Nýrsko',
    layout: '5 + 1',
    area: 180,
    owner_id: 2,
    involvement: 'Pronájem a správa',
    complete: true,
    active: true,
    residential: true,
    unit_number: '841',
    floor_number: 1,
    floor_count: 2,
    barrier_free: false,
    heating: 'Ústřední',
    note: '',
    cadastral_area: 'Nýrsko',
    gps_lat: 49.2925,
    gps_lng: 13.144,
    building_numbers: [{number: '841', kind: 'Popisné'}],
    parcels: [
      {parcel_number: '452', parcel_area: 320, parcel_type: 'Zastavěná plocha'},
      {parcel_number: '453', parcel_area: 900, parcel_type: 'Zahrada'},
    ],
    equipment: [{equipment_type: 'Alarm'}, {equipment_type: 'Bazén'}],
  },
  {
    id: 3,
    type: 'Byt',
    address: 'Baarova 2670/13, Praha – Michle',
    layout: '2 + kk',
    area: 48,
    owner_id: 3,
    involvement: 'Správa',
    complete: false,
    active: true,
    residential: true,
    unit_number: '2670/13',
    floor_number: 2,
    floor_count: 5,
    barrier_free: false,
    heating: 'Dálkové',
    note: 'Profil není kompletní.',
    cadastral_area: 'Michle',
    gps_lat: 50.0498,
    gps_lng: 14.4585,
    building_numbers: [
      {number: '2670', kind: 'Popisné'},
      {number: '13', kind: 'Orientační'},
    ],
    parcels: [{parcel_number: '2100/3', parcel_area: 150, parcel_type: 'Zastavěná plocha'}],
    equipment: [],
  },
  {
    id: 4,
    type: 'Byt',
    address: 'Vrchlického 3025/11, Praha – Michle',
    layout: '2 + 1',
    area: 55,
    owner_id: 4,
    involvement: 'Pronájem a správa',
    complete: true,
    active: true,
    residential: true,
    unit_number: '3025/11',
    floor_number: 4,
    floor_count: 8,
    barrier_free: true,
    heating: 'Dálkové',
    note: '',
    cadastral_area: 'Michle',
    gps_lat: 50.053,
    gps_lng: 14.46,
    building_numbers: [{number: '3025', kind: 'Popisné'}],
    parcels: [{parcel_number: '3010/1', parcel_area: 180, parcel_type: 'Zastavěná plocha'}],
    equipment: [],
  },
  {
    id: 5,
    type: 'Pozemek',
    address: 'Čechova 2125/27, Praha – Východ',
    layout: '—',
    area: 640,
    owner_id: 5,
    involvement: 'Správa',
    complete: true,
    active: false,
    residential: false,
    unit_number: '2125/27',
    floor_number: 0,
    floor_count: 0,
    barrier_free: false,
    heating: 'Žádné',
    note: 'Neaktivní.',
    cadastral_area: 'Dolní Počernice',
    gps_lat: 50.087,
    gps_lng: 14.59,
    building_numbers: [],
    parcels: [{parcel_number: '2125/27', parcel_area: 640, parcel_type: 'Orná půda'}],
    equipment: [],
  },
  {
    id: 6,
    type: 'Byt',
    address: 'Blatenská 719/28, Praha – Lobzy',
    layout: '1 + 1',
    area: 38,
    owner_id: 6,
    involvement: 'Pronájem a správa',
    complete: true,
    active: true,
    residential: true,
    unit_number: '719/28',
    floor_number: 1,
    floor_count: 4,
    barrier_free: false,
    heating: 'Lokální',
    note: '',
    cadastral_area: 'Lobzy',
    gps_lat: 49.748,
    gps_lng: 13.42,
    building_numbers: [
      {number: '719', kind: 'Popisné'},
      {number: '28', kind: 'Orientační'},
    ],
    parcels: [{parcel_number: '820/4', parcel_area: 120, parcel_type: 'Zastavěná plocha'}],
    equipment: [],
  },
  {
    id: 7,
    type: 'Apartmán',
    address: 'Smetanova 210/7, Praha – Smíchov',
    layout: '3 + kk',
    area: 76,
    owner_id: 4,
    involvement: 'Pronájem a správa',
    complete: false,
    active: true,
    residential: true,
    unit_number: '210/7',
    floor_number: 5,
    floor_count: 6,
    barrier_free: true,
    heating: 'Dálkové',
    note: '',
    cadastral_area: 'Smíchov',
    gps_lat: 50.07,
    gps_lng: 14.403,
    building_numbers: [
      {number: '210', kind: 'Popisné'},
      {number: '7', kind: 'Orientační'},
    ],
    parcels: [{parcel_number: '3300/2', parcel_area: 200, parcel_type: 'Zastavěná plocha'}],
    equipment: [],
  },
  {
    id: 8,
    type: 'Byt',
    address: 'Janská 5680/2, Praha – Sever',
    layout: '2 + kk',
    area: 46,
    owner_id: 5,
    involvement: 'Pronájem a správa',
    complete: true,
    active: true,
    residential: true,
    unit_number: '5680/2',
    floor_number: 2,
    floor_count: 7,
    barrier_free: false,
    heating: 'Dálkové',
    note: '',
    cadastral_area: 'Sever',
    gps_lat: 50.66,
    gps_lng: 14.04,
    building_numbers: [
      {number: '5680', kind: 'Popisné'},
      {number: '2', kind: 'Orientační'},
    ],
    parcels: [{parcel_number: '900/1', parcel_area: 160, parcel_type: 'Zastavěná plocha'}],
    equipment: [],
  },
];

// Enums for the property building-number / parcel array item fields.
export const BUILDING_NUMBER_KINDS = ['Popisné', 'Orientační', 'Evidenční'];
export const PARCEL_TYPES = ['Zastavěná plocha', 'Zahrada', 'Ostatní plocha', 'Orná půda'];
// HAB-837 coverage: `equipment`'s enum. 'Jiné' is excluded from the fixed checklist via the box's
// `array.listed.otherValues`, so it only exercises the free "other row" path.
export const EQUIPMENT_TYPES = ['Alarm', 'Klimatizace', 'Bazén', 'Výtah', 'Jiné'];

// ----------------------------------------------------------------------------
// Photos domain — images shown in the property gallery box (related by property_id).
// The gallery reads `image.url`; SVG data URIs render offline (no network in stories).
// ----------------------------------------------------------------------------

export type Photo = {
  id: number;
  property_id: number;
  image: {url: string; filename: string};
  caption: string;
};

const photoImage = (label: string, color: string): {url: string; filename: string} => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='44' fill='white'>${label}</text></svg>`;
  return {url: `data:image/svg+xml,${encodeURIComponent(svg)}`, filename: `${label}.svg`};
};

export const PHOTOS: Photo[] = [
  {id: 1, property_id: 1, image: photoImage('Obývací pokoj', '#2f6f6f'), caption: 'Obývací pokoj'},
  {id: 2, property_id: 1, image: photoImage('Kuchyně', '#3f7fae'), caption: 'Kuchyně'},
  {id: 3, property_id: 1, image: photoImage('Ložnice', '#8a5fae'), caption: 'Ložnice'},
  {id: 4, property_id: 2, image: photoImage('Fasáda', '#ae6f3f'), caption: 'Fasáda'},
  {id: 5, property_id: 2, image: photoImage('Zahrada', '#4f9f5f'), caption: 'Zahrada'},
  {id: 6, property_id: 3, image: photoImage('Pokoj', '#6f6f8a'), caption: 'Pohled do pokoje'},
  {id: 7, property_id: 4, image: photoImage('Balkon', '#9f7f4f'), caption: 'Balkon'},
];

export const PROPERTY_TYPES = ['Byt', 'Dům', 'Apartmán', 'Pozemek'];
export const INVOLVEMENTS = ['Pronájem a správa', 'Správa', 'Pronájem'];
export const HEATING_OPTIONS = ['Dálkové', 'Ústřední', 'Lokální', 'Žádné'];
export const PROPERTY_LAYOUTS = [
  '1 + kk',
  '1 + 1',
  '2 + kk',
  '2 + 1',
  '3 + kk',
  '3 + 1',
  '5 + 1',
  '—',
];
export const REPORT_REASONS = ['Poškození', 'Stížnost', 'Údržba', 'Ostatní'];

// ----------------------------------------------------------------------------
// Documents domain — each document belongs to a property.
// ----------------------------------------------------------------------------

export type Document = {
  id: number;
  title: string;
  category: string;
  property_id: number;
  issued_on: string;
  valid_until: string;
  amount: number;
  signed: boolean;
  note: string;
};

export const DOCUMENT_CATEGORIES = [
  'Nájemní smlouva',
  'Faktura',
  'Předávací protokol',
  'Revizní zpráva',
  'Ostatní',
];

export const DOCUMENTS: Document[] = [
  {
    id: 1,
    title: 'Nájemní smlouva – Kyjovská 578/13',
    category: 'Nájemní smlouva',
    property_id: 1,
    issued_on: '2024-01-15',
    valid_until: '2026-01-14',
    amount: 15000,
    signed: true,
    note: '',
  },
  {
    id: 2,
    title: 'Faktura za správu 01/2025',
    category: 'Faktura',
    property_id: 1,
    issued_on: '2025-01-31',
    valid_until: '2025-02-14',
    amount: 2500,
    signed: true,
    note: '',
  },
  {
    id: 3,
    title: 'Předávací protokol – Karla Čapka 841',
    category: 'Předávací protokol',
    property_id: 2,
    issued_on: '2023-09-01',
    valid_until: '',
    amount: 0,
    signed: true,
    note: 'Předáno vlastníkovi.',
  },
  {
    id: 4,
    title: 'Revizní zpráva elektro',
    category: 'Revizní zpráva',
    property_id: 4,
    issued_on: '2024-06-10',
    valid_until: '2028-06-09',
    amount: 3200,
    signed: true,
    note: '',
  },
  {
    id: 5,
    title: 'Nájemní smlouva – Blatenská 719/28',
    category: 'Nájemní smlouva',
    property_id: 6,
    issued_on: '2024-03-01',
    valid_until: '2025-02-28',
    amount: 12000,
    signed: true,
    note: '',
  },
  {
    id: 6,
    title: 'Faktura za opravu',
    category: 'Faktura',
    property_id: 3,
    issued_on: '2025-02-20',
    valid_until: '2025-03-06',
    amount: 8400,
    signed: false,
    note: 'Čeká na schválení.',
  },
  {
    id: 7,
    title: 'Revizní zpráva plyn',
    category: 'Revizní zpráva',
    property_id: 7,
    issued_on: '2024-11-05',
    valid_until: '2027-11-04',
    amount: 2100,
    signed: true,
    note: '',
  },
  {
    id: 8,
    title: 'Nájemní smlouva – Janská 5680/2',
    category: 'Nájemní smlouva',
    property_id: 8,
    issued_on: '2024-07-01',
    valid_until: '2026-06-30',
    amount: 13500,
    signed: true,
    note: '',
  },
];

// ----------------------------------------------------------------------------
// Payments domain — each payment ties a property to an owner.
// ----------------------------------------------------------------------------

export type Payment = {
  id: number;
  property_id: number;
  owner_id: number;
  variable_symbol: string;
  amount: number;
  direction: string;
  status: string;
  method: string;
  due_date: string;
  paid_on: string;
  note: string;
};

export const PAYMENT_DIRECTIONS = ['Příjem', 'Výdaj'];
export const PAYMENT_STATUSES = ['Uhrazeno', 'Čeká na úhradu', 'Po splatnosti', 'Stornováno'];
export const PAYMENT_METHODS = ['Bankovní převod', 'Hotově', 'Kartou', 'Inkaso'];

export const PAYMENTS: Payment[] = [
  {
    id: 1,
    property_id: 1,
    owner_id: 1,
    variable_symbol: '2025001',
    amount: 15000,
    direction: 'Příjem',
    status: 'Uhrazeno',
    method: 'Bankovní převod',
    due_date: '2025-01-10',
    paid_on: '2025-01-08',
    note: '',
  },
  {
    id: 2,
    property_id: 2,
    owner_id: 2,
    variable_symbol: '2025002',
    amount: 22000,
    direction: 'Příjem',
    status: 'Uhrazeno',
    method: 'Bankovní převod',
    due_date: '2025-01-10',
    paid_on: '2025-01-09',
    note: '',
  },
  {
    id: 3,
    property_id: 3,
    owner_id: 3,
    variable_symbol: '2025003',
    amount: 11500,
    direction: 'Příjem',
    status: 'Po splatnosti',
    method: 'Bankovní převod',
    due_date: '2025-01-10',
    paid_on: '',
    note: 'Odeslána upomínka.',
  },
  {
    id: 4,
    property_id: 4,
    owner_id: 4,
    variable_symbol: '2025004',
    amount: 18000,
    direction: 'Příjem',
    status: 'Čeká na úhradu',
    method: 'Inkaso',
    due_date: '2025-02-10',
    paid_on: '',
    note: '',
  },
  {
    id: 5,
    property_id: 1,
    owner_id: 1,
    variable_symbol: '2025005',
    amount: 2500,
    direction: 'Výdaj',
    status: 'Uhrazeno',
    method: 'Kartou',
    due_date: '2025-02-01',
    paid_on: '2025-02-01',
    note: 'Servis výtahu.',
  },
  {
    id: 6,
    property_id: 6,
    owner_id: 6,
    variable_symbol: '2025006',
    amount: 12000,
    direction: 'Příjem',
    status: 'Uhrazeno',
    method: 'Bankovní převod',
    due_date: '2025-01-15',
    paid_on: '2025-01-14',
    note: '',
  },
  {
    id: 7,
    property_id: 5,
    owner_id: 5,
    variable_symbol: '2025007',
    amount: 8400,
    direction: 'Výdaj',
    status: 'Stornováno',
    method: 'Bankovní převod',
    due_date: '2025-02-05',
    paid_on: '',
    note: 'Chybná faktura.',
  },
  {
    id: 8,
    property_id: 7,
    owner_id: 4,
    variable_symbol: '2025008',
    amount: 21000,
    direction: 'Příjem',
    status: 'Čeká na úhradu',
    method: 'Bankovní převod',
    due_date: '2025-03-10',
    paid_on: '',
    note: '',
  },
];

// ----------------------------------------------------------------------------
// Schema authoring helpers
// ----------------------------------------------------------------------------

const asEnum = (values: readonly string[]): EnumType =>
  values.map((value) => ({value, label: value}));

// Colour a plain choices enum by value, so status-like fields render coloured chips.
const withColors = (
  values: readonly string[],
  colors: Record<string, EnumType[number]['color']>
): EnumType =>
  values.map((value) => ({value, label: value, ...(colors[value] ? {color: colors[value]} : {})}));

// Choices enums for payment status / direction, coloured so the datagrid shows meaningful chips.
const PAYMENT_STATUS_ENUM: EnumType = withColors(PAYMENT_STATUSES, {
  Uhrazeno: 'success',
  'Čeká na úhradu': 'warning',
  'Po splatnosti': 'error',
  Stornováno: 'secondary',
});
const PAYMENT_DIRECTION_ENUM: EnumType = withColors(PAYMENT_DIRECTIONS, {
  Příjem: 'success',
  Výdaj: 'error',
});

// A field descriptor references a field by name; its label/format come from the method field schema.
const fd = (name: string, extra: Partial<FieldDescriptor> = {}): FieldDescriptor => ({
  type: 'field',
  name,
  ...extra,
});

// ----------------------------------------------------------------------------
// Row actions — the standard detail / edit / delete actions offered on a list row.
//
// All three render as row-action buttons (showInList). `show` (eye) is *also* what a row click
// resolves to — the datagrid's default row activation navigates to `show ?? edit` (see
// `resolveRowAction`) — so the detail has two entry points: the eye button and the row click.
// `edit` (view) and `delete` (resource) are the pencil / trash buttons. These land on each record's
// `meta.schema.actions` (via `decorate`) — that's what the list reads.
// ----------------------------------------------------------------------------

// A view action's `view` params for a plain redirect. Deliberately WITHOUT `choices`: an empty
// `choices: []` is still truthy, which makes SchemaViewButton render a (choice-less, invisible)
// split button instead of a normal one — so the row button would silently disappear. `choices` is
// typed as required on `ViewActionParameters`, hence the cast.
const redirectView = (viewName: string): ViewActionParameters =>
  ({name: viewName, mode: 'redirect', parameters: {}}) as ViewActionParameters;

// A redirect to a routed *action* view (`/:id/a/<action>`). Unlike a reserved view (which routes by
// type alone), an action view routes by its `actionName`, so the button needs it in `endpoint` to
// build the `/a/<action>` path — otherwise it navigates to `/a/undefined` and matches nothing.
const redirectActionView = (
  viewName: string,
  resource: string,
  actionName: string
): ViewActionParameters =>
  ({
    name: viewName,
    mode: 'redirect',
    parameters: {},
    endpoint: referenceTo(resource, {actionName}),
  }) as ViewActionParameters;

// Same, but opens the target view in a dialog instead of navigating to its own page. `dialogWidth`
// caps the dialog: a MUI breakpoint (`xs`/`sm`/`md`/`lg`/`xl`) or any CSS width (e.g. `'480px'`);
// when omitted the trigger defaults to `xl`.
const dialogView = (viewName: string, dialogWidth?: string): ViewActionParameters =>
  ({
    name: viewName,
    mode: 'dialog',
    parameters: {},
    ...(dialogWidth ? {dialogWidth} : {}),
  }) as ViewActionParameters;

// Same, but docks the target view into the list's side panel beside the table (a record preview)
// instead of navigating or opening a dialog — the `single_click_action` pattern from `openapi.yaml`
// (`view.mode: sidepanel`).
const sidepanelView = (viewName: string): ViewActionParameters =>
  ({name: viewName, mode: 'sidepanel', parameters: {}}) as ViewActionParameters;

const RECORD_ACTIONS: ResourceActionSchema[] = [
  {
    name: 'show',
    type: 'view',
    isDetail: true,
    // Rendered as an explicit eye button *and* what a row click resolves to (two ways to the detail).
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
    // Row-action button on the list *and* a global toolbar action on the record detail.
    showInList: true,
    showInDetail: true,
    label: 'Upravit',
    icon: 'Edit',
    view: redirectView('edit'),
  },
  {
    name: 'delete',
    type: 'resource',
    isDetail: true,
    // Row-action button on the list *and* a global toolbar action on the record detail.
    showInList: true,
    showInDetail: true,
    label: 'Smazat',
    icon: 'Delete',
    color: 'error',
    resource: {endpoint: {method: 'delete'}, data: {}},
    confirmDialog: {
      title: 'Smazat záznam',
      message: 'Opravdu chcete tento záznam smazat? Tuto akci nelze vrátit.',
    },
  },
];

// The GlobalResourceActionSchema mirror declared on the resource (the ServiceSchema `actions`).
const toBaseActions = (actions: ResourceActionSchema[]): GlobalResourceActionSchema[] =>
  actions.map(({name, type, isDetail, showInList, showInDetail}) => ({
    name,
    type,
    isDetail,
    showInList,
    showInDetail,
  }));

const BASE_ACTIONS: GlobalResourceActionSchema[] = toBaseActions(RECORD_ACTIONS);

// Property-only preview action. A pure row-click target (no rendered button — `showInList` /
// `showInDetail` false): it opens the compact `preview` show view docked in the list side panel
// (`view.mode: sidepanel`). Wired as the property list's `singleClickAction` so a single row click
// shows quick info, while a double click keeps the default `show` redirect to the full detail page.
const PROPERTY_PREVIEW_ACTION: ResourceActionSchema = {
  name: 'preview',
  type: 'view',
  isDetail: true,
  showInList: false,
  showInDetail: false,
  label: 'Náhled',
  icon: 'Visibility',
  view: sidepanelView('preview'),
};

// Property-only custom action ("report an issue"): a detail-toolbar button that opens the `report`
// action view (reason + note form) in a dialog. `type: 'view'` targeting the action-type `report`
// view in `dialog` mode; detail-only (no per-row list button). Scoped to the property resource.
const PROPERTY_REPORT_ACTION: ResourceActionSchema = {
  name: 'report',
  type: 'view',
  isDetail: true,
  showInList: false,
  showInDetail: true,
  label: 'Nahlásit závadu',
  icon: 'ReportProblem',
  view: dialogView('report', 'sm'),
};

// Properties carry the shared record actions (with `report` slotted between edit and delete on the
// detail toolbar, and `show` opened in a dialog instead of the shared redirect) plus the preview
// click target. Owners keep the plain `RECORD_ACTIONS` (no report / preview view), so both stay
// scoped to the property resource.
const PROPERTY_RECORD_ACTIONS: ResourceActionSchema[] = [
  ...RECORD_ACTIONS.flatMap((action) => {
    if (action.name === 'show') return [{...action, view: dialogView('show')}];
    if (action.name === 'delete') return [PROPERTY_REPORT_ACTION, action];
    return [action];
  }),
  PROPERTY_PREVIEW_ACTION,
];
const PROPERTY_BASE_ACTIONS: GlobalResourceActionSchema[] = toBaseActions(PROPERTY_RECORD_ACTIONS);

// A single Create action, set explicitly on list toolbars / list-box headers (rather than letting
// them auto-generate from the resource actions) so they show *only* Create — the per-row detail /
// edit / delete actions stay on the rows and never leak into a toolbar. A list-level `view` action
// (isDetail: false) opening the `create` view.
const CREATE_ACTIONS: ActionDescriptor[] = [
  {
    name: 'create',
    label: 'Vytvořit',
    icon: 'Add',
    action: {type: 'view', isDetail: false, view: redirectView('create')},
  },
];

// Owner variants: Create and Edit open in a dialog instead of on their own page (detail / delete
// keep the shared behaviour). Used for the owners resource everywhere — list rows, list toolbar,
// the property detail's owners list box, and the owner detail toolbar.
const OWNER_RECORD_ACTIONS: ResourceActionSchema[] = RECORD_ACTIONS.map((action) =>
  action.name === 'edit' ? {...action, view: dialogView('edit')} : action
);

const OWNER_CREATE_ACTIONS: ActionDescriptor[] = [
  {
    ...CREATE_ACTIONS[0],
    action: {type: 'view', isDetail: false, view: dialogView('create')},
  },
];

// The property detail's Vlastníci list box offers Create *and* a "link existing owner" action — the
// latter opens a small dialog (`link_owner` action view) with an owner autocomplete
// (SchemaReferenceInput) to pair an already-existing owner to the property.
const OWNER_LIST_BOX_ACTIONS: ActionDescriptor[] = [
  ...OWNER_CREATE_ACTIONS,
  {
    name: 'link_owner',
    label: 'Spárovat existujícího vlastníka',
    icon: 'Link',
    action: {type: 'view', isDetail: false, view: dialogView('link_owner', 'sm')},
  },
];

// ----------------------------------------------------------------------------
// Properties — field, filter, box and view schemas
// ----------------------------------------------------------------------------

// The full property field set. Shared by every method endpoint (get/post/put) — the *views* pick
// which fields to show through their boxes, so the method only has to *contain* every referenced
// field. `reason` is an action-only form field (not on the record).
const PROPERTY_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {
    name: 'address',
    type: 'string',
    format: 'text',
    label: 'Adresa',
    required: true,
    sortable: true,
  },
  {
    name: 'type',
    type: 'string',
    format: 'choices',
    label: 'Typ',
    enum: asEnum(PROPERTY_TYPES),
    sortable: true,
  },
  {
    name: 'layout',
    type: 'string',
    format: 'choices',
    label: 'Dispozice',
    enum: asEnum(PROPERTY_LAYOUTS),
  },
  {name: 'area', type: 'integer', label: 'Plocha (m²)', sortable: true},
  {
    name: 'owner_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(OWNERS_RESOURCE),
    label: 'Vlastník',
  },
  {
    name: 'involvement',
    type: 'string',
    format: 'choices',
    label: 'Forma správy',
    enum: asEnum(INVOLVEMENTS),
  },
  {
    name: 'heating',
    type: 'string',
    format: 'choices',
    label: 'Vytápění',
    enum: asEnum(HEATING_OPTIONS),
  },
  {name: 'unit_number', type: 'string', format: 'text', label: 'Číslo jednotky'},
  {name: 'floor_number', type: 'integer', label: 'Podlaží'},
  {name: 'floor_count', type: 'integer', label: 'Počet podlaží'},
  {name: 'residential', type: 'boolean', label: 'K bydlení'},
  {name: 'barrier_free', type: 'boolean', label: 'Bezbariérové'},
  {name: 'complete', type: 'boolean', label: 'Profil kompletní'},
  {name: 'active', type: 'boolean', label: 'Aktivní'},
  {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
  {name: 'bank_account', type: 'string', format: 'text', label: 'Bankovní účet'},
  // location:
  {name: 'cadastral_area', type: 'string', format: 'text', label: 'Katastrální území'},
  {
    name: 'gps_lat',
    type: 'number',
    format: 'decimal',
    label: 'GPS šířka',
    options: {number: {maximumFractionDigits: 5}},
  },
  {
    name: 'gps_lng',
    type: 'number',
    format: 'decimal',
    label: 'GPS délka',
    options: {number: {maximumFractionDigits: 5}},
  },
  // nested object field (its sub-fields back the `object` detail box — Kontakt tab):
  {
    name: 'contact',
    type: 'object',
    label: 'Kontaktní údaje',
    properties: [
      {name: 'email', type: 'string', format: 'email', label: 'E-mail'},
      {name: 'phone', type: 'string', format: 'phone', label: 'Telefon'},
    ],
  },
  // array fields (each item is an object with its own sub-fields):
  {
    name: 'building_numbers',
    type: 'array',
    label: 'Další čísla budovy',
    items: {
      type: 'object',
      properties: [
        {name: 'number', type: 'string', format: 'text', label: 'Číslo'},
        {
          name: 'kind',
          type: 'string',
          format: 'choices',
          label: 'Typ čísla',
          enum: asEnum(BUILDING_NUMBER_KINDS),
        },
      ],
    },
  },
  {
    name: 'parcels',
    type: 'array',
    label: 'Parcely',
    items: {
      type: 'object',
      properties: [
        {name: 'parcel_number', type: 'string', format: 'text', label: 'Číslo parcely'},
        {name: 'parcel_area', type: 'integer', label: 'Výměra (m²)'},
        {
          name: 'parcel_type',
          type: 'string',
          format: 'choices',
          label: 'Druh pozemku',
          enum: asEnum(PARCEL_TYPES),
        },
      ],
    },
  },
  // HAB-837 coverage: backs the `SchemaChoicesArrayBox` (checklist of `equipment_type` enum values,
  // each togglable via a checkbox — plus free "other" rows for 'Jiné', see the box definition).
  {
    name: 'equipment',
    type: 'array',
    label: 'Vybavení',
    items: {
      type: 'object',
      properties: [
        {
          name: 'equipment_type',
          type: 'string',
          format: 'choices',
          label: 'Vybavení',
          enum: asEnum(EQUIPMENT_TYPES),
        },
        {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
      ],
    },
  },
  // action-only:
  {
    name: 'reason',
    type: 'string',
    format: 'choices',
    label: 'Důvod',
    enum: asEnum(REPORT_REASONS),
    required: true,
  },
];

const PROPERTY_FILTERS: FilterSchema[] = [
  {name: 'q', type: 'string', format: 'search', label: 'Hledat'},
  {name: 'type', type: 'string', format: 'choices', label: 'Typ', enum: asEnum(PROPERTY_TYPES)},
  {name: 'active', type: 'boolean', label: 'Aktivní'},
];

const PROPERTY_LIST_COLUMNS: FieldDescriptor[] = [
  fd('address', {sortable: true}),
  fd('type', {sortable: true, format: 'choices', enum: asEnum(PROPERTY_TYPES)}),
  fd('layout'),
  fd('area', {sortable: true}),
  fd('owner_id', {format: 'relation', reference: referenceTo(OWNERS_RESOURCE)}),
  fd('involvement'),
  fd('active'),
];

const PROPERTY_LIST_FILTERS: FilterDescriptor[] = [
  {name: 'q', isAlwaysOn: true},
  {name: 'type', isAlwaysOn: true},
  {name: 'active'},
];

// Grid-item spans: `HALF` = two boxes per row on md+, `FULL` = one box across the whole row.
// The parent grid box is a 12-column grid (PanelGridContext default), so 6 = half, 12 = full.
const HALF: GridItemBoxParameters = {xs: 12, sm: 12, md: 6, lg: 6, xl: 6};
const FULL: GridItemBoxParameters = {xs: 12, sm: 12, md: 12, lg: 12, xl: 12};

// Shared detail layout, wrapped in a tab box (show renders read-only, edit renders inputs — the view
// type decides). Tab 1 "Adresa a parcely" is a grid box whose cells are `grid-item` boxes carrying
// the column width (`gridItem`) — the production convention: a grid never sizes its children by their
// own type, the layout width lives on an explicit `grid-item` wrapper (6/12 → two-per-row, 12/12 →
// full row). A `grid-item` is a transparent width carrier (it renders as a card-less group) unless it
// is given a label/card of its own, in which case it doubles as the card holding the fields directly
// (the two production patterns: wrap-a-box vs. be-the-card). Here Fotografie / Další čísla budovy /
// Parcely wrap a content box (gallery / array), while Lokace / Poznámka are card `grid-item`s holding
// fields. Tab 2 "Vlastníci" is a single list box.
//
// Tabs 3-5 are HAB-687 box-layout coverage (see the comment inside `boxes`): "Kontakt" (object box),
// "Rozšířené" (a grid of `grid-item`s — a collapsible card holding fields + a wrapper field and a
// nested collapsible box) and "Dokumenty" (a nested-fill-height list) — so these box types and the
// tricky compositions the redesign touches are visually verifiable in both show and edit views. The
// `wizard` box lives on the create view (see PROPERTY_CREATE_BOX), where a stepper actually makes
// sense, not on a detail tab.
const PROPERTY_DETAIL_BOX: BoxSchema = {
  name: 'detail',
  type: 'tab',
  readOnly: false,
  tab: {showToolbarNavigation: false},
  boxes: [
    {
      name: 'address',
      type: 'grid',
      label: 'Adresa a parcely',
      card: false,
      readOnly: false,
      boxes: [
        // Half-width `grid-item` wrapping the gallery card (transparent width carrier).
        {
          name: 'photos_item',
          type: 'grid-item',
          card: false,
          readOnly: true,
          gridItem: HALF,
          boxes: [
            {
              name: 'photos',
              type: 'gallery',
              label: 'Fotografie',
              card: true,
              readOnly: true,
              gallery: {
                reference: referenceTo(PHOTOS_RESOURCE),
                target: 'property_id',
                imageField: 'image',
              },
              // Header toolbar action → navigates to the "Správa fotografií" subpage
              // (`/…/properties/:id/a/manage_photos`), a detail-scoped routed action view.
              toolbarActions: [
                {
                  name: 'manage_photos',
                  label: 'Spravovat fotografie',
                  icon: 'PhotoLibrary',
                  action: {
                    type: 'view',
                    isDetail: true,
                    view: redirectActionView('manage_photos', PROPERTIES_RESOURCE, 'manage_photos'),
                  },
                },
              ],
            },
          ],
        },
        // Half-width `grid-item` that *is* the card and holds fields directly.
        {
          name: 'location',
          type: 'grid-item',
          label: 'Lokace',
          card: true,
          readOnly: false,
          gridItem: HALF,
          boxes: [fd('address'), fd('cadastral_area'), fd('gps_lat'), fd('gps_lng')],
        },
        {
          name: 'note',
          type: 'grid-item',
          label: 'Poznámka',
          card: true,
          readOnly: false,
          gridItem: HALF,
          boxes: [fd('note')],
        },
        // Half-width `grid-item` wrapping an array card.
        {
          name: 'building_numbers_item',
          type: 'grid-item',
          card: false,
          readOnly: false,
          gridItem: HALF,
          boxes: [
            {
              name: 'building_numbers',
              type: 'array',
              label: 'Další čísla budovy',
              card: true,
              readOnly: false,
              // Non-inline array (contrast with the inline `parcels` datagrid below): each row renders
              // as a headerless nested panel holding a PropertyList of the row's attributes.
              array: {target: 'building_numbers'},
              boxes: [fd('number'), fd('kind')],
            },
          ],
        },
        // Full-width `grid-item` wrapping the parcels array card.
        {
          name: 'parcels_item',
          type: 'grid-item',
          card: false,
          readOnly: false,
          gridItem: FULL,
          boxes: [
            {
              name: 'parcels',
              type: 'array',
              label: 'Parcely',
              card: true,
              readOnly: false,
              array: {target: 'parcels', inline: true},
              boxes: [fd('parcel_number'), fd('parcel_area'), fd('parcel_type')],
            },
          ],
        },
        // Full-width `grid-item` wrapping the equipment checklist — HAB-837 coverage:
        // `SchemaChoicesArrayBox` (checkbox-per-enum-value rows, plus a free "Jiné" row via
        // `otherValues`), the box type HAB-837 fixed row/checkbox alignment for.
        {
          name: 'equipment_item',
          type: 'grid-item',
          card: false,
          readOnly: false,
          gridItem: FULL,
          boxes: [
            {
              name: 'equipment',
              type: 'array',
              label: 'Vybavení',
              card: true,
              readOnly: false,
              array: {
                target: 'equipment',
                inline: true,
                listed: {fieldName: 'equipment_type', otherValues: ['Jiné']},
              },
              // `note`'s `helpText` is deliberate regression coverage: a React Admin input with
              // visible helper text renders taller than its row siblings, which is what first
              // exposed the checkbox column floating above center instead of centering against the
              // row's real control height (fixed via `FormTableColumn.align: 'center'`).
              boxes: [fd('equipment_type'), fd('note', {helpText: 'Volitelný doplňující popis'})],
            },
          ],
        },
      ],
    },
    // A card-less wrapper stacking two boxes — exercises a list box *with* a label ("Vlastníci")
    // alongside a plain simple box ("Bankovní účet"); contrast with the label-less list box on the
    // Dokumenty tab below.
    {
      name: 'owners_tab',
      type: 'simple',
      label: 'Vlastníci',
      card: false,
      readOnly: true,
      boxes: [
        // HAB-833 coverage: a relation field with `targetSource` (`owner_id__full_name` resolves to
        // the `owner_id` relation with `targetSource: 'full_name'`), rendered directly in a Show/Edit
        // box — i.e. through `SchemaPropertyItem`, *outside* a datagrid — must show a single label
        // ("Jméno vlastníka"), not the field's own duplicated one.
        {
          name: 'owner_name_box',
          type: 'simple',
          label: 'Vlastník',
          card: true,
          readOnly: false,
          boxes: [fd('owner_id__full_name', {label: 'Jméno vlastníka'})],
        },
        {
          name: 'bank_account_box',
          type: 'simple',
          label: 'Bankovní účet',
          card: true,
          readOnly: false,
          boxes: [fd('bank_account')],
        },
        {
          name: 'owners',
          type: 'list',
          // A list box *with* a label → renders inside a Panel titled "Vlastníci" (it is nested here,
          // not a direct tab child, so its label is not suppressed).
          label: 'Vlastníci',
          card: true,
          readOnly: true,
          // `listActions` set explicitly (Create + "link existing owner") instead of the owner
          // collection defaults a backend would send.
          list: {reference: referenceTo(OWNERS_RESOURCE), listActions: OWNER_LIST_BOX_ACTIONS},
          boxes: [fd('full_name'), fd('email'), fd('phone')],
        },
      ],
    },
    // --- HAB-687 box-layout coverage tabs (exercise the box types / compositions the redesign
    // touches, so each migration step is visually verifiable against `next`). ---
    // `object` box — reads the nested `contact` object; editable in the edit view.
    {
      name: 'contact_tab',
      type: 'object',
      label: 'Kontakt',
      // Card so the email/phone object renders inside a Panel; the label stays for the tab title but
      // the panel is headerless (the tab renders the box with `label={false}`).
      card: true,
      readOnly: false,
      object: {target: 'contact'},
      boxes: [fd('email'), fd('phone')],
    },
    // A grid of two half-width `grid-item`s exercising the tricky field compositions:
    //  - `flags`     — a card `grid-item` (collapsible open) holding plain boolean fields directly.
    //  - `technical` — a `grid-item` wrapping a MIXED simple box: plain fields + a `wrapper` field
    //                  (two inputs under one label) + a nested collapsible (closed) box, as siblings.
    {
      name: 'advanced',
      type: 'grid',
      label: 'Rozšířené',
      card: false,
      readOnly: false,
      boxes: [
        {
          name: 'flags',
          type: 'grid-item',
          label: 'Příznaky',
          card: true,
          readOnly: false,
          collapsible: 'open',
          gridItem: HALF,
          boxes: [fd('residential'), fd('barrier_free'), fd('active'), fd('complete')],
        },
        {
          name: 'technical_item',
          type: 'grid-item',
          card: false,
          readOnly: false,
          gridItem: HALF,
          boxes: [
            {
              name: 'technical',
              type: 'simple',
              label: 'Technické parametry',
              card: true,
              readOnly: false,
              boxes: [
                fd('heating'),
                // wrapper field — groups two inputs under a single label / outlined group.
                fd('gps', {
                  label: 'GPS (šířka / délka)',
                  wrapper: {fields: [fd('gps_lat'), fd('gps_lng')]},
                }),
                // nested box among fields → makes `technical` a mixed field+box container.
                {
                  name: 'floors',
                  type: 'simple',
                  label: 'Podlaží',
                  card: true,
                  readOnly: false,
                  collapsible: 'closed',
                  boxes: [fd('floor_number'), fd('floor_count')],
                },
              ],
            },
          ],
        },
      ],
    },
    // Nested-fill-height composition — a card-less simple box wrapping a growing nested `list` box
    // (the outer box must fill height so the datagrid reaches the bottom).
    {
      name: 'documents_tab',
      type: 'simple',
      label: 'Dokumenty',
      card: false,
      readOnly: true,
      boxes: [
        {
          name: 'documents',
          type: 'list',
          // A list box *without* a label → renders as a headerless Panel (contrast with the labelled
          // "Vlastníci" list box on the Vlastníci tab).
          card: true,
          readOnly: true,
          list: {
            reference: referenceTo(DOCUMENTS_RESOURCE),
            target: 'property_id',
            // Search (`q`) stays shown inline in the toolbar (`isAlwaysOn`); the rest go to the
            // filter drawer. Listing them all keeps `category` / `signed` available (a `filters` list
            // is the whole selection, so omitting them would drop them).
            filters: [{name: 'q', isAlwaysOn: true}, {name: 'category'}, {name: 'signed'}],
            // List action (reference-bound → rendered in the list header): opens the documents
            // `bulk_upload` action view (files + note) in a dialog.
            listActions: [
              {
                name: 'bulk_upload',
                label: 'Hromadný upload dokumentů',
                icon: 'Description',
                // A single-column form (dropzone + note), so cap it narrow instead of the `xl` default.
                action: {type: 'view', isDetail: false, view: dialogView('bulk_upload', 'sm')},
              },
            ],
          },
          boxes: [fd('title'), fd('category'), fd('issued_on'), fd('amount')],
        },
      ],
    },
  ],
};

// Create form — a `wizard` box: two steps over nested simple boxes (everything except the computed
// status flags). The wizard's `bottomActions` put Save in its own toolbar row, beside Prev / Next (on
// the last step, as this is a create form); the view's empty `bottomActions` drop the form's default
// Save bar below, so the button is not shown twice.
// This is the harness's `wizard` box-type coverage — a wizard belongs on a create form, not a detail
// tab.
const PROPERTY_CREATE_BOX: BoxSchema = {
  name: 'create',
  type: 'wizard',
  card: false,
  label: 'Nová nemovitost',
  readOnly: false,
  wizard: {showToolbarNavigation: true, validateSteps: false},
  bottomActions: [{name: 'save', label: 'Uložit', action: {type: 'save', isDetail: false}}],
  boxes: [
    {
      name: 'step_basic',
      type: 'simple',
      label: 'Základní údaje',
      card: false,
      readOnly: false,
      boxes: [fd('address'), fd('type'), fd('layout'), fd('area')],
    },
    {
      name: 'step_management',
      type: 'simple',
      label: 'Správa a parametry',
      card: false,
      readOnly: false,
      boxes: [fd('owner_id'), fd('involvement'), fd('unit_number'), fd('heating')],
    },
  ],
};

// Custom action ("report an issue"): a small form submitted from a property's detail. A bare,
// card-less field group (no label / card → `SchemaSimpleBox` renders a transparent `Section`) so
// the form sits directly on the dialog surface rather than in a nested panel — the dialog already
// supplies the title (the view `label`) and the surrounding card.
const PROPERTY_REPORT_BOX: BoxSchema = {
  name: 'report',
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [fd('reason'), fd('note')],
};

// Compact quick-info layout for the docked side panel (single row click). A bare, card-less field
// group (no label / card / actions → `SchemaSimpleBox` renders a transparent `Section`): the side
// panel is already a card, so the preview lists the property attributes flush inside it, with no
// nested panel of its own. Deliberately far smaller than PROPERTY_DETAIL_BOX (the tabbed full
// detail reached by double click), so the panel reads as a preview, not the page.
const PROPERTY_PREVIEW_BOX: BoxSchema = {
  name: 'preview',
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [fd('address'), fd('type'), fd('layout'), fd('area'), fd('owner_id'), fd('involvement')],
};

// "Správa fotografií" subpage body — a plain, read-only photos list (image + caption) scoped to the
// property (`target: property_id`), with no extra controls. Reached from the Fotografie gallery box's
// "Spravovat fotografie" toolbar action.
const PROPERTY_MANAGE_PHOTOS_BOX: BoxSchema = {
  name: 'manage_photos',
  type: 'list',
  label: 'Správa fotografií',
  card: true,
  readOnly: true,
  list: {reference: referenceTo(PHOTOS_RESOURCE), target: 'property_id'},
  boxes: [fd('image'), fd('caption')],
};

const PROPERTY_ENDPOINT: EndpointsSchema = {
  get: {fields: PROPERTY_FIELDS, filters: PROPERTY_FILTERS},
  post: {fields: PROPERTY_FIELDS},
  put: {fields: PROPERTY_FIELDS},
  patch: {fields: []},
  delete: {fields: []},
};

const PROPERTY_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'properties',
  pkFieldName: 'id',
  url: PROPERTIES_URL,
  actions: PROPERTY_RECORD_ACTIONS,
  endpoints: PROPERTY_ENDPOINT,
  views: [
    {
      name: 'list',
      type: 'list',
      isDetail: false,
      endpoint: {method: 'get'},
      list: {
        boxes: PROPERTY_LIST_COLUMNS,
        filters: PROPERTY_LIST_FILTERS,
        defaultSorting: {fieldName: 'id', direction: 'asc'},
        toolbarActions: CREATE_ACTIONS,
        // Single click docks a compact preview beside the table (the `preview` action opens the
        // `preview` show view in `sidepanel` mode); double click opens the full detail (`show`,
        // overridden to `dialog` mode on `PROPERTY_RECORD_ACTIONS`) in a dialog instead of navigating
        // to its own page. The schema-layer analogue of the admin `PropertyList` side panel.
        singleClickAction: {name: 'preview'},
        doubleClickAction: {name: 'show'},
      },
    },
    {
      name: 'show',
      type: 'show',
      isDetail: true,
      label: 'Nemovitost',
      endpoint: {method: 'get'},
      detail: {box: PROPERTY_DETAIL_BOX},
      // A backend-supplied trail (overrides the route-derived one) with three crumbs, so the header
      // breadcrumb exercises the collapse: the middle crumb folds behind the `…` popover.
      breadcrumbs: [
        {
          name: 'properties',
          label: 'Nemovitosti',
          priority: 0,
          type: 'link',
          link: {url: `/${PROPERTIES_RESOURCE}`},
        },
        {
          name: 'locality',
          label: 'Praha – Michle',
          priority: 1,
          type: 'link',
          link: {url: `/${PROPERTIES_RESOURCE}`},
        },
        {name: 'detail', label: 'Kyjovská 578/13', priority: 2, type: 'text'},
      ],
    },
    {
      name: 'preview',
      type: 'show',
      isDetail: true,
      label: 'Náhled nemovitosti',
      endpoint: {method: 'get'},
      // Quick-info shown in the docked side panel; the default show toolbar (edit / delete) still
      // renders in the panel header, mirroring the admin-layer preview panel.
      detail: {box: PROPERTY_PREVIEW_BOX},
    },
    {
      name: 'edit',
      type: 'edit',
      isDetail: true,
      label: 'Úprava nemovitosti',
      endpoint: {method: 'put'},
      // No app-bar actions while editing — suppress the auto-generated edit / report / delete toolbar
      // (the detail/show view keeps them). The form's own Save/Cancel live at the bottom.
      detail: {box: PROPERTY_DETAIL_BOX, toolbarActions: []},
    },
    {
      name: 'create',
      type: 'create',
      isDetail: false,
      label: 'Nová nemovitost',
      endpoint: {method: 'post'},
      // Empty toolbar actions: a new record has nothing to edit / delete, so suppress the auto-
      // generated detail toolbar actions (they would otherwise show on the create view).
      // Empty bottom actions: Save sits in the wizard's toolbar (see PROPERTY_CREATE_BOX).
      detail: {box: PROPERTY_CREATE_BOX, toolbarActions: [], bottomActions: []},
    },
    {
      name: 'report',
      type: 'action',
      isDetail: true,
      label: 'Nahlásit závadu',
      endpoint: {
        method: 'post',
        reference: referenceTo(PROPERTIES_RESOURCE, {actionName: 'report'}),
      },
      detail: {
        box: PROPERTY_REPORT_BOX,
        // Empty toolbar actions: this action form has nothing to edit / delete, so suppress the
        // auto-generated detail toolbar (edit / delete would otherwise show in the dialog header).
        toolbarActions: [],
        bottomActions: [
          {
            name: 'save',
            label: 'Odeslat hlášení',
            // Opened as a dialog from the detail toolbar → `prev` closes the dialog and returns to
            // the detail on submit (rather than navigating away to the list).
            action: {type: 'save', isDetail: true, save: {data: {}, afterSave: 'prev'}},
          },
        ],
      },
    },
    // "Správa fotografií" — a detail-scoped, routed (`redirect`) subpage reached from the Fotografie
    // gallery box toolbar. A read-only `list` box (the property's photos), no controls / bottom
    // actions. Routed at `/…/properties/:id/a/manage_photos`.
    {
      name: 'manage_photos',
      type: 'action',
      isDetail: true,
      label: 'Správa fotografií',
      endpoint: {
        method: 'get',
        reference: referenceTo(PROPERTIES_RESOURCE, {actionName: 'manage_photos'}),
      },
      detail: {box: PROPERTY_MANAGE_PHOTOS_BOX, toolbarActions: []},
    },
  ],
};

// ----------------------------------------------------------------------------
// Owners — minimal schema (target of the property `owner` relation).
// ----------------------------------------------------------------------------

const OWNER_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'full_name', type: 'string', format: 'text', label: 'Jméno', sortable: true},
  {name: 'first_name', type: 'string', format: 'text', label: 'Křestní jméno'},
  {name: 'surname', type: 'string', format: 'text', label: 'Příjmení', sortable: true},
  {name: 'email', type: 'string', format: 'email', label: 'E-mail'},
  {name: 'phone', type: 'string', format: 'phone', label: 'Telefon'},
];

const OWNER_FILTERS: FilterSchema[] = [
  {name: 'q', type: 'string', format: 'search', label: 'Hledat'},
];

const OWNER_LIST_FILTERS: FilterDescriptor[] = [{name: 'q', isAlwaysOn: true}];

// Half-width "Kontakt" card (e-mail + phone). Shared by every owner box — it sits beside a "Jméno"
// card whose fields differ per view.
const OWNER_CONTACT_CARD: BoxSchema = {
  name: 'contact',
  type: 'grid-item',
  label: 'Kontakt',
  card: true,
  readOnly: false,
  gridItem: HALF,
  boxes: [fd('email'), fd('phone')],
};

// Two half-width cards side by side: "Jméno" beside "Kontakt".
// Show reads the combined `full_name`; edit splits it into `first_name` + `surname` so both parts
// are editable (a combined read-only name can't be edited field by field).
const OWNER_DETAIL_BOX: BoxSchema = {
  name: 'owner',
  type: 'grid',
  card: false,
  readOnly: false,
  boxes: [
    {
      name: 'name',
      type: 'grid-item',
      label: 'Jméno',
      card: true,
      readOnly: false,
      gridItem: HALF,
      boxes: [fd('full_name')],
    },
    OWNER_CONTACT_CARD,
  ],
};

// A tab box (instead of the read-only detail's side-by-side cards) - shared by both `edit` and
// `create` below, both opened in a dialog (OWNER_RECORD_ACTIONS / OWNER_CREATE_ACTIONS). Reachable
// from the owners list, the owner detail toolbar, AND from inside the property detail's own
// "Vlastníci" tab box (the owners list box there, see PROPERTY_DETAIL_BOX) - so this doubles as
// coverage for a tab box nested inside a dialog opened from a page that itself has a tab box.
// The "Jméno" card is the only thing the two views differ in, hence `nameBoxes`.
const ownerFormBox = (nameBoxes: FieldDescriptor[]): BoxSchema => ({
  name: 'owner',
  type: 'tab',
  readOnly: false,
  tab: {showToolbarNavigation: false},
  boxes: [
    {
      name: 'name',
      type: 'simple',
      label: 'Jméno',
      readOnly: false,
      boxes: nameBoxes,
    },
    {
      name: 'contact',
      type: 'simple',
      label: 'Kontakt',
      readOnly: false,
      boxes: [fd('email'), fd('phone')],
    },
  ],
});

// Edit opens with the record's `id`. It carries `readOnly: true` in OWNER_FIELDS, so the form
// renders it as a read-only value instead of an input - coverage for a read-only field sitting
// among editable ones in an edit form.
const OWNER_EDIT_BOX: BoxSchema = ownerFormBox([fd('id'), fd('first_name'), fd('surname')]);

// Create has no id yet, so its "Jméno" card starts straight at the editable name fields.
const OWNER_CREATE_BOX: BoxSchema = ownerFormBox([fd('first_name'), fd('surname')]);

// "Link existing owner" action form — a single owner-picker autocomplete over the owners resource
// (`format: relation` → SchemaReferenceInput). Lives on the owners `patch` method so it
// stays separate from the create form (which owns `post`).
const OWNER_LINK_FIELDS: FieldSchema[] = [
  {
    name: 'owner_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(OWNERS_RESOURCE),
    label: 'Vlastník',
    required: true,
  },
];

// Card-less form box for the dialog — the dialog supplies the surface and title, so the box just
// holds the single owner autocomplete.
const OWNER_LINK_BOX: BoxSchema = {
  name: 'link_owner',
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [fd('owner_id')],
};

const OWNER_ENDPOINT: EndpointsSchema = {
  get: {fields: OWNER_FIELDS, filters: OWNER_FILTERS},
  post: {fields: OWNER_FIELDS},
  put: {fields: OWNER_FIELDS},
  patch: {fields: OWNER_LINK_FIELDS},
  delete: {fields: []},
};

const OWNER_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'owners',
  pkFieldName: 'id',
  url: OWNERS_URL,
  actions: OWNER_RECORD_ACTIONS,
  endpoints: OWNER_ENDPOINT,
  views: [
    {
      name: 'list',
      type: 'list',
      isDetail: false,
      endpoint: {method: 'get'},
      list: {
        boxes: [fd('full_name', {sortable: true}), fd('email'), fd('phone')],
        filters: OWNER_LIST_FILTERS,
        defaultSorting: {fieldName: 'surname', direction: 'asc'},
        toolbarActions: OWNER_CREATE_ACTIONS,
      },
    },
    {
      name: 'show',
      type: 'show',
      isDetail: true,
      label: 'Vlastník',
      endpoint: {method: 'get'},
      detail: {box: OWNER_DETAIL_BOX},
    },
    {
      name: 'edit',
      type: 'edit',
      isDetail: true,
      label: 'Úprava vlastníka',
      endpoint: {method: 'put'},
      // No toolbar actions while editing — suppress the auto-generated delete (the owner detail keeps
      // it). The dialog's own footer Save/Cancel handle submitting.
      detail: {box: OWNER_EDIT_BOX, toolbarActions: []},
    },
    {
      name: 'create',
      type: 'create',
      isDetail: false,
      label: 'Nový vlastník',
      endpoint: {method: 'post'},
      detail: {
        // Empty toolbar actions — nothing to edit / delete on a not-yet-created owner.
        toolbarActions: [],
        // Same split as edit: "Jméno" (křestní jméno + příjmení) beside "Kontakt", minus the id.
        box: OWNER_CREATE_BOX,
      },
    },
    // A list-level `action` view opened in a dialog from the property detail's Vlastníci list box.
    // Its form is a single owner autocomplete; the bottom Save "links" the chosen existing owner.
    {
      name: 'link_owner',
      type: 'action',
      isDetail: false,
      label: 'Spárovat existujícího vlastníka',
      endpoint: {
        method: 'patch',
        reference: referenceTo(OWNERS_RESOURCE, {actionName: 'link_owner'}),
      },
      detail: {
        box: OWNER_LINK_BOX,
        // Suppress the auto-generated owner edit / delete toolbar actions (they would otherwise leak
        // into the dialog header, as they do on the owner detail).
        toolbarActions: [],
        bottomActions: [
          {
            name: 'save',
            label: 'Spárovat',
            action: {type: 'save', isDetail: false, save: {data: {}, afterSave: 'prev'}},
          },
        ],
      },
    },
  ],
};

// ----------------------------------------------------------------------------
// Photos — minimal list-only schema backing the property gallery box (no menu, referenced by url).
// ----------------------------------------------------------------------------

const PHOTO_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'image', type: 'object', format: 'base64-image', label: 'Fotografie'},
  {
    name: 'property_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(PROPERTIES_RESOURCE),
    label: 'Nemovitost',
  },
  {name: 'caption', type: 'string', format: 'text', label: 'Popisek'},
];

const PHOTO_ENDPOINT: EndpointsSchema = {
  get: {fields: PHOTO_FIELDS},
  post: {fields: []},
  put: {fields: []},
  patch: {fields: []},
  delete: {fields: []},
};

const PHOTO_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'photos',
  pkFieldName: 'id',
  url: PHOTOS_URL,
  actions: [],
  endpoints: PHOTO_ENDPOINT,
  views: [
    {
      name: 'list',
      type: 'list',
      isDetail: false,
      endpoint: {method: 'get'},
      list: {boxes: [fd('image'), fd('caption')]},
    },
  ],
};

// ----------------------------------------------------------------------------
// Documents — field, filter and list view schema (relates to a property; list-only).
// ----------------------------------------------------------------------------

const DOCUMENT_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {name: 'title', type: 'string', format: 'text', label: 'Název', required: true, sortable: true},
  {
    name: 'category',
    type: 'string',
    format: 'choices',
    label: 'Kategorie',
    enum: asEnum(DOCUMENT_CATEGORIES),
    required: true,
    sortable: true,
  },
  {
    name: 'property_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(PROPERTIES_RESOURCE),
    label: 'Nemovitost',
  },
  {name: 'issued_on', type: 'string', format: 'date', label: 'Vystaveno', sortable: true},
  {name: 'valid_until', type: 'string', format: 'date', label: 'Platnost do'},
  {
    name: 'amount',
    type: 'number',
    format: 'decimal',
    label: 'Částka',
    sortable: true,
    options: {number: {style: 'currency', currency: 'CZK', maximumFractionDigits: 0}},
  },
  {name: 'signed', type: 'boolean', label: 'Podepsáno'},
  {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
];

const DOCUMENT_FILTERS: FilterSchema[] = [
  {name: 'q', type: 'string', format: 'search', label: 'Hledat'},
  {
    name: 'category',
    type: 'string',
    format: 'choices',
    label: 'Kategorie',
    enum: asEnum(DOCUMENT_CATEGORIES),
  },
  {name: 'signed', type: 'boolean', label: 'Podepsáno'},
];

const DOCUMENT_LIST_COLUMNS: FieldDescriptor[] = [
  fd('title', {sortable: true}),
  fd('category', {sortable: true, format: 'choices', enum: asEnum(DOCUMENT_CATEGORIES)}),
  fd('property_id', {format: 'relation', reference: referenceTo(PROPERTIES_RESOURCE)}),
  fd('issued_on', {sortable: true}),
  fd('amount', {sortable: true}),
  fd('signed'),
];

const DOCUMENT_LIST_FILTERS: FilterDescriptor[] = [
  {name: 'q', isAlwaysOn: true},
  {name: 'category', isAlwaysOn: true},
  {name: 'signed'},
];

// Bulk-upload action form (opened in a dialog from the property detail's Dokumenty list toolbar):
// a multi-file upload input (`files`) + an optional note. These back the `bulk_upload` action's
// `post` method schema, so they live on the documents `post` endpoint below.
const DOCUMENT_BULK_UPLOAD_FIELDS: FieldSchema[] = [
  {
    name: 'files',
    type: 'array',
    label: 'Soubory k uploadu',
    required: true,
    // An array of `base64-file` items renders the multi-file `UploadInput` (see defaultInputProvider).
    items: {type: 'object', format: 'base64-file'},
  },
  {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
];

// Card-less form box for the dialog — the dialog supplies the surface and the title, so the box just
// stacks its two inputs.
const DOCUMENT_BULK_UPLOAD_BOX: BoxSchema = {
  name: 'bulk_upload',
  type: 'simple',
  card: false,
  readOnly: false,
  boxes: [fd('files'), fd('note')],
};

const DOCUMENT_ENDPOINT: EndpointsSchema = {
  get: {fields: DOCUMENT_FIELDS, filters: DOCUMENT_FILTERS},
  post: {fields: DOCUMENT_BULK_UPLOAD_FIELDS},
  put: {fields: []},
  patch: {fields: []},
  delete: {fields: []},
};

const DOCUMENT_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'documents',
  pkFieldName: 'id',
  url: DOCUMENTS_URL,
  actions: [],
  endpoints: DOCUMENT_ENDPOINT,
  views: [
    {
      name: 'list',
      type: 'list',
      isDetail: false,
      endpoint: {method: 'get'},
      list: {
        boxes: DOCUMENT_LIST_COLUMNS,
        filters: DOCUMENT_LIST_FILTERS,
        defaultSorting: {fieldName: 'issued_on', direction: 'desc'},
      },
    },
    // A list-level `action` view (not tied to a record) opened in a dialog from the Dokumenty list
    // toolbar. Its form is DOCUMENT_BULK_UPLOAD_BOX; the bottom Save submits the upload.
    {
      name: 'bulk_upload',
      type: 'action',
      isDetail: false,
      label: 'Hromadný upload dokumentů',
      endpoint: {
        method: 'post',
        reference: referenceTo(DOCUMENTS_RESOURCE, {actionName: 'bulk_upload'}),
      },
      detail: {
        box: DOCUMENT_BULK_UPLOAD_BOX,
        bottomActions: [
          {
            name: 'save',
            // `afterSave: 'prev'` closes the dialog and returns to the page it opened from (the
            // documents list, which `refreshSchema` reloads) — `'list'` would instead swap the view
            // in place, showing the list inside the dialog.
            label: 'Nahrát',
            action: {type: 'save', isDetail: false, save: {data: {}, afterSave: 'prev'}},
          },
        ],
      },
    },
  ],
};

// ----------------------------------------------------------------------------
// Payments — field, filter and list view schema (ties a property to an owner; list-only).
// ----------------------------------------------------------------------------

const PAYMENT_FIELDS: FieldSchema[] = [
  {name: 'id', type: 'integer', label: 'ID', readOnly: true, sortable: true},
  {
    name: 'property_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(PROPERTIES_RESOURCE),
    label: 'Nemovitost',
  },
  {
    name: 'owner_id',
    type: 'integer',
    format: 'relation',
    reference: referenceTo(OWNERS_RESOURCE),
    label: 'Vlastník',
  },
  {
    name: 'variable_symbol',
    type: 'string',
    format: 'text',
    label: 'Variabilní symbol',
    sortable: true,
  },
  {
    name: 'amount',
    type: 'number',
    format: 'decimal',
    label: 'Částka',
    sortable: true,
    options: {number: {style: 'currency', currency: 'CZK', maximumFractionDigits: 0}},
  },
  {
    name: 'direction',
    type: 'string',
    format: 'choices',
    label: 'Směr',
    enum: PAYMENT_DIRECTION_ENUM,
  },
  {
    name: 'status',
    type: 'string',
    format: 'choices',
    label: 'Stav',
    enum: PAYMENT_STATUS_ENUM,
    sortable: true,
  },
  {
    name: 'method',
    type: 'string',
    format: 'choices',
    label: 'Způsob úhrady',
    enum: asEnum(PAYMENT_METHODS),
  },
  {name: 'due_date', type: 'string', format: 'date', label: 'Splatnost', sortable: true},
  {name: 'paid_on', type: 'string', format: 'date', label: 'Uhrazeno dne'},
  {name: 'note', type: 'string', format: 'text', label: 'Poznámka'},
];

const PAYMENT_FILTERS: FilterSchema[] = [
  {name: 'q', type: 'string', format: 'search', label: 'Hledat'},
  {
    name: 'status',
    type: 'string',
    format: 'choices',
    label: 'Stav',
    enum: PAYMENT_STATUS_ENUM,
  },
  {
    name: 'direction',
    type: 'string',
    format: 'choices',
    label: 'Směr',
    enum: PAYMENT_DIRECTION_ENUM,
  },
];

// Payment-only "mark as paid" action, the target of the list's *field* action column below (a
// `FieldAction` in python terms: a field descriptor whose value is a button running an action).
// `type: 'resource'` → a direct call on the record (PATCH `…/payments/:id/mark_paid`) rather than a
// view to open, so the row updates in place instead of navigating anywhere.
//
// Both `showInList` and `showInDetail` are false on purpose: those flags drive the *generated*
// buttons (the row-action column and the detail toolbar), and here the action's only trigger is the
// explicit field column — `SchemaActionField` looks the schema up by name in the record's
// `meta.schema.actions`, which ignores them. Keeping `showInList` false also leaves the datagrid's
// row-action column switched off entirely (payments carry no detail / edit / delete).
const PAYMENT_MARK_PAID_ACTION: ResourceActionSchema = {
  name: 'mark_paid',
  type: 'resource',
  isDetail: true,
  showInList: false,
  showInDetail: false,
  label: 'Uhradit',
  icon: 'CheckCircle',
  color: 'success',
  // `path` is what reaches the data provider's `callAction` (the mock keys its handler off it).
  resource: {endpoint: {method: 'patch', path: 'mark_paid'}, data: {}},
  confirmDialog: {
    title: 'Uhradit platbu',
    message: 'Opravdu chcete tuto platbu označit jako uhrazenou?',
  },
};

// Hides the `mark_paid` action on payments that are settled or cancelled — nothing left to pay in
// either state. String literals may contain any characters, the accented `"Stornováno"` included.
const PAYMENT_MARK_PAID_SHOW_QUERY = 'record.status != "Uhrazeno" && record.status != "Stornováno"';

// The field action itself — a field descriptor carrying an `action` instead of a value, so
// `SchemaFieldOrInput` routes it to `SchemaActionField` and the slot renders a button. This is the
// list column's version, with its own label for the column header; the detail card below builds a
// label-less descriptor of its own (the button already carries the action's label, and the row
// would otherwise print "Uhradit" twice), sharing only the `showQuery`.
const PAYMENT_MARK_PAID_FIELD: FieldDescriptor = fd('mark_paid', {
  label: 'Uhradit',
  action: {name: 'mark_paid'},
  options: {dynamicRender: {showQuery: PAYMENT_MARK_PAID_SHOW_QUERY}},
});

// Payments reuse the shared `show` row action so the detail view below is reachable from the list
// (eye button + row-click target). They deliberately get no edit / delete: the only thing this
// resource offers beyond reading is settling the payment, and that is `mark_paid`.
const PAYMENT_SHOW_ACTION: ResourceActionSchema = {
  name: 'show',
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: false,
  label: 'Detail',
  icon: 'Visibility',
  view: redirectView('show'),
};

const PAYMENT_RECORD_ACTIONS: ResourceActionSchema[] = [
  PAYMENT_SHOW_ACTION,
  PAYMENT_MARK_PAID_ACTION,
];

// Payment detail (show) layout — two half-width cards, mirroring the owner detail's grid /
// `grid-item` shape. "Úhrada" carries the same `mark_paid` field action as the list column, and
// that is the point of the pairing: one descriptor, two renderings. Outside a collection nothing
// sets `isInCollection`, so `SchemaActionField` leaves `showLabel` undefined and the button keeps
// its label instead of collapsing to the bare icon it becomes in a datagrid cell.
const PAYMENT_DETAIL_BOX: BoxSchema = {
  name: 'payment',
  type: 'grid',
  card: false,
  readOnly: false,
  boxes: [
    {
      name: 'summary',
      type: 'grid-item',
      label: 'Platba',
      card: true,
      readOnly: false,
      gridItem: HALF,
      boxes: [
        fd('variable_symbol'),
        fd('property_id'),
        fd('owner_id'),
        fd('amount'),
        fd('direction'),
      ],
    },
    {
      name: 'settlement',
      type: 'grid-item',
      label: 'Úhrada',
      card: true,
      readOnly: false,
      gridItem: HALF,
      boxes: [
        fd('status'),
        fd('method'),
        fd('due_date'),
        fd('mark_paid', {
          action: {name: 'mark_paid'},
          options: {dynamicRender: {showQuery: PAYMENT_MARK_PAID_SHOW_QUERY}},
        }),
        fd('paid_on'),
      ],
    },
    {
      name: 'note_item',
      type: 'grid-item',
      label: 'Poznámka',
      card: true,
      readOnly: false,
      gridItem: FULL,
      boxes: [fd('note')],
    },
  ],
};

const PAYMENT_LIST_COLUMNS: FieldDescriptor[] = [
  fd('variable_symbol', {sortable: true}),
  fd('property_id', {format: 'relation', reference: referenceTo(PROPERTIES_RESOURCE)}),
  fd('amount', {sortable: true}),
  fd('direction', {format: 'choices', enum: PAYMENT_DIRECTION_ENUM}),
  fd('status', {sortable: true, format: 'choices', enum: PAYMENT_STATUS_ENUM}),
  fd('due_date', {sortable: true}),
  PAYMENT_MARK_PAID_FIELD,
];

const PAYMENT_LIST_FILTERS: FilterDescriptor[] = [
  {name: 'q', isAlwaysOn: true},
  {name: 'status', isAlwaysOn: true},
  {name: 'direction'},
];

const PAYMENT_ENDPOINT: EndpointsSchema = {
  get: {fields: PAYMENT_FIELDS, filters: PAYMENT_FILTERS},
  post: {fields: []},
  put: {fields: []},
  patch: {fields: []},
  delete: {fields: []},
};

const PAYMENT_RESOURCE_SCHEMA: LocalResourceSchema = {
  name: 'payments',
  pkFieldName: 'id',
  url: PAYMENTS_URL,
  actions: PAYMENT_RECORD_ACTIONS,
  endpoints: PAYMENT_ENDPOINT,
  views: [
    {
      name: 'list',
      type: 'list',
      isDetail: false,
      endpoint: {method: 'get'},
      list: {
        boxes: PAYMENT_LIST_COLUMNS,
        filters: PAYMENT_LIST_FILTERS,
        defaultSorting: {fieldName: 'due_date', direction: 'desc'},
      },
    },
    {
      name: 'show',
      type: 'show',
      isDetail: true,
      label: 'Platba',
      endpoint: {method: 'get'},
      // No `toolbarActions` override needed: neither payment action sets `showInDetail`, so the
      // header toolbar stays empty and the `mark_paid` field button is the detail's only trigger.
      detail: {box: PAYMENT_DETAIL_BOX},
    },
  ],
};

// ----------------------------------------------------------------------------
// Service schema (GlobalResourceSchema[]) — drives resource registration + routing.
// ----------------------------------------------------------------------------

const PROPERTY_BASE_VIEWS: GlobalViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}},
  {name: 'create', type: 'create', isDetail: false, endpoint: {method: 'post'}},
  {name: 'edit', type: 'edit', isDetail: true, endpoint: {method: 'put'}},
  {name: 'show', type: 'show', isDetail: true, endpoint: {method: 'get'}},
  // Preview show view, docked into the list side panel (single click). `mode: sidepanel` is the
  // default the row activation inherits when opening it.
  {name: 'preview', type: 'show', isDetail: true, mode: 'sidepanel', endpoint: {method: 'get'}},
  // Opens as a dialog from the property detail toolbar (the `report` action button); `mode: dialog`
  // is what the toolbar action inherits when resolving this target view.
  {
    name: 'report',
    type: 'action',
    isDetail: true,
    mode: 'dialog',
    endpoint: {method: 'post', reference: referenceTo(PROPERTIES_RESOURCE, {actionName: 'report'})},
  },
  // "Správa fotografií" subpage — a routed (`redirect`) detail action view, so its toolbar button
  // navigates to `/…/properties/:id/a/manage_photos` instead of opening an overlay.
  {
    name: 'manage_photos',
    type: 'action',
    isDetail: true,
    mode: 'redirect',
    endpoint: {
      method: 'get',
      reference: referenceTo(PROPERTIES_RESOURCE, {actionName: 'manage_photos'}),
    },
  },
];

const OWNER_BASE_VIEWS: GlobalViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}},
  {name: 'create', type: 'create', isDetail: false, endpoint: {method: 'post'}},
  {name: 'edit', type: 'edit', isDetail: true, endpoint: {method: 'put'}},
  {name: 'show', type: 'show', isDetail: true, endpoint: {method: 'get'}},
  // Base view for the "link existing owner" action so its list-box toolbar button resolves. Dialog.
  {
    name: 'link_owner',
    type: 'action',
    isDetail: false,
    mode: 'dialog',
    endpoint: {
      method: 'patch',
      reference: referenceTo(OWNERS_RESOURCE, {actionName: 'link_owner'}),
    },
  },
];

const DOCUMENT_BASE_VIEWS: GlobalViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}},
  // Base view for the bulk-upload action so `getGlobalViewSchema` resolves it (a toolbar action button
  // only renders when its target view is registered here). Opens as a dialog.
  {
    name: 'bulk_upload',
    type: 'action',
    isDetail: false,
    mode: 'dialog',
    endpoint: {
      method: 'post',
      reference: referenceTo(DOCUMENTS_RESOURCE, {actionName: 'bulk_upload'}),
    },
  },
];

const PAYMENT_BASE_VIEWS: GlobalViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}},
  {name: 'show', type: 'show', isDetail: true, endpoint: {method: 'get'}},
];

const PHOTO_BASE_VIEWS: GlobalViewSchema[] = [
  {name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}},
];

// A resource menu entry pointing at the resource's own list view — the left-nav item the schema
// layer renders (icons are MUI icon names, matching `admin/pages` `_shell`). `priority` sets order.
const listMenu = (name: string, label: string, icon: string, priority: number): MenuSchema => ({
  name,
  label,
  icon,
  priority,
  type: 'view',
  view: {name: 'list', choices: [], mode: 'redirect', parameters: {}},
});

const SERVICE_SCHEMA: ServiceSchema = [
  {
    name: 'properties',
    pkFieldName: 'id',
    label: 'Nemovitosti',
    url: PROPERTIES_URL,
    // Dashboard-eligible + aggregatable: backs table / simple-aggregate widgets and (via the
    // aggregate endpoint) the aggregate / bar / pie / line widgets in the dashboard harness.
    menu: listMenu('properties', 'Nemovitosti', 'Home', 20),
    views: PROPERTY_BASE_VIEWS,
    actions: PROPERTY_BASE_ACTIONS,
  },
  {
    name: 'owners',
    pkFieldName: 'id',
    label: 'Vlastníci',
    url: OWNERS_URL,
    // Dashboard-eligible but NOT aggregatable → offered for table / simple-aggregate widgets only
    // (exercises the wizard's per-widget-type resource gating in `resourceSupportsDataSource`).
    menu: listMenu('owners', 'Vlastníci', 'Groups', 30),
    views: OWNER_BASE_VIEWS,
    actions: BASE_ACTIONS,
  },
  {
    name: 'documents',
    pkFieldName: 'id',
    label: 'Dokumenty',
    url: DOCUMENTS_URL,
    menu: listMenu('documents', 'Dokumenty', 'Description', 40),
    views: DOCUMENT_BASE_VIEWS,
    actions: [],
  },
  {
    name: 'payments',
    pkFieldName: 'id',
    label: 'Platby',
    url: PAYMENTS_URL,
    // The dashboard's main data source — rich enough (amount / status / direction / due_date) to
    // drive every chart widget type.
    menu: listMenu('payments', 'Platby', 'CreditCard', 50),
    views: PAYMENT_BASE_VIEWS,
    actions: toBaseActions(PAYMENT_RECORD_ACTIONS),
  },
  {
    // No `menu` → not shown in the left nav; only referenced by the property gallery box.
    name: 'photos',
    pkFieldName: 'id',
    label: 'Fotografie',
    url: PHOTOS_URL,
    views: PHOTO_BASE_VIEWS,
    actions: [],
  } satisfies GlobalResourceSchema,
];

// ----------------------------------------------------------------------------
// English localization — the schemas are authored in Czech; when a schema is requested for the `en`
// locale, `localizeSchema` returns a deep copy with every human-readable string (`label`, plus the
// confirm-dialog `title` / `message`) translated through `LABELS_EN`. Enum *values* stay Czech (they
// match the fixture data); only their `label`s are translated, so choices/relations keep resolving
// while displaying English text. Any string missing from the dictionary falls back to the original.
// ----------------------------------------------------------------------------

const LABELS_EN: Record<string, string> = {
  // Menu / resources
  Nemovitosti: 'Properties',
  Vlastníci: 'Owners',
  Dokumenty: 'Documents',
  Platby: 'Payments',
  Fotografie: 'Photos',
  // View / box titles
  Nemovitost: 'Property',
  'Úprava nemovitosti': 'Edit property',
  'Nová nemovitost': 'New property',
  'Nahlásit závadu': 'Report an issue',
  Vlastník: 'Owner',
  'Úprava vlastníka': 'Edit owner',
  'Nový vlastník': 'New owner',
  'Adresa a parcely': 'Address and parcels',
  Lokace: 'Location',
  // HAB-687 coverage tabs / boxes
  Kontakt: 'Contact',
  'Kontaktní údaje': 'Contact details',
  Rozšířené: 'Advanced',
  Příznaky: 'Flags',
  'Technické parametry': 'Technical parameters',
  'GPS (šířka / délka)': 'GPS (lat / lng)',
  'Dokumenty k nemovitosti': 'Property documents',
  // create wizard steps
  'Základní údaje': 'Basic info',
  'Správa a parametry': 'Management and parameters',
  // Actions & confirm dialog
  Detail: 'Detail',
  Upravit: 'Edit',
  Smazat: 'Delete',
  Vytvořit: 'Create',
  'Spárovat existujícího vlastníka': 'Link an existing owner',
  Spárovat: 'Link',
  'Spravovat fotografie': 'Manage photos',
  'Správa fotografií': 'Photo management',
  'Odeslat hlášení': 'Submit report',
  'Smazat záznam': 'Delete record',
  'Opravdu chcete tento záznam smazat? Tuto akci nelze vrátit.':
    'Are you sure you want to delete this record? This action cannot be undone.',
  Uhradit: 'Pay',
  Platba: 'Payment',
  Úhrada: 'Settlement',
  'Uhradit platbu': 'Pay the payment',
  'Opravdu chcete tuto platbu označit jako uhrazenou?':
    'Are you sure you want to mark this payment as paid?',
  // Property fields
  Adresa: 'Address',
  Typ: 'Type',
  Dispozice: 'Layout',
  'Plocha (m²)': 'Area (m²)',
  'Forma správy': 'Management',
  Vytápění: 'Heating',
  'Číslo jednotky': 'Unit number',
  Podlaží: 'Floor',
  'Počet podlaží': 'Floor count',
  'K bydlení': 'Residential',
  Bezbariérové: 'Barrier-free',
  'Profil kompletní': 'Profile complete',
  Aktivní: 'Active',
  Poznámka: 'Note',
  'Katastrální území': 'Cadastral area',
  'GPS šířka': 'GPS latitude',
  'GPS délka': 'GPS longitude',
  'Další čísla budovy': 'Additional building numbers',
  Číslo: 'Number',
  'Typ čísla': 'Number type',
  Parcely: 'Parcels',
  'Číslo parcely': 'Parcel number',
  'Výměra (m²)': 'Area (m²)',
  'Druh pozemku': 'Land type',
  Důvod: 'Reason',
  Hledat: 'Search',
  // Owner fields
  Jméno: 'Name',
  'Křestní jméno': 'First name',
  Příjmení: 'Surname',
  'E-mail': 'Email',
  Telefon: 'Phone',
  // Photo fields
  Popisek: 'Caption',
  // Document fields
  Název: 'Title',
  Kategorie: 'Category',
  Vystaveno: 'Issued on',
  'Platnost do': 'Valid until',
  Částka: 'Amount',
  Podepsáno: 'Signed',
  // Bulk-upload action
  'Hromadný upload dokumentů': 'Bulk document upload',
  'Soubory k uploadu': 'Files to upload',
  Nahrát: 'Upload',
  // Document categories
  'Nájemní smlouva': 'Lease agreement',
  Faktura: 'Invoice',
  'Předávací protokol': 'Handover protocol',
  'Revizní zpráva': 'Inspection report',
  Ostatní: 'Other',
  // Payment fields
  'Variabilní symbol': 'Variable symbol',
  Směr: 'Direction',
  Stav: 'Status',
  'Způsob úhrady': 'Payment method',
  Splatnost: 'Due date',
  'Uhrazeno dne': 'Paid on',
  // Payment enums
  Příjem: 'Income',
  Výdaj: 'Expense',
  Uhrazeno: 'Paid',
  'Čeká na úhradu': 'Pending',
  'Po splatnosti': 'Overdue',
  Stornováno: 'Cancelled',
  'Bankovní převod': 'Bank transfer',
  Hotově: 'Cash',
  Kartou: 'Card',
  Inkaso: 'Direct debit',
  // Property enums (types / involvement / heating / building kinds / parcel types / reasons)
  Byt: 'Flat',
  Dům: 'House',
  Apartmán: 'Apartment',
  Pozemek: 'Land',
  'Pronájem a správa': 'Rental and management',
  Správa: 'Management',
  Pronájem: 'Rental',
  Dálkové: 'District',
  Ústřední: 'Central',
  Lokální: 'Local',
  Žádné: 'None',
  Popisné: 'Descriptive',
  Orientační: 'Orientation',
  Evidenční: 'Registration',
  'Zastavěná plocha': 'Built-up area',
  Zahrada: 'Garden',
  'Ostatní plocha': 'Other area',
  'Orná půda': 'Arable land',
  Poškození: 'Damage',
  Stížnost: 'Complaint',
  Údržba: 'Maintenance',
};

// Keys whose string values are human-readable and should be translated for `en`.
const TRANSLATABLE_KEYS = new Set(['label', 'title', 'message']);

const localizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(localizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) =>
        TRANSLATABLE_KEYS.has(key) && typeof val === 'string'
          ? [key, LABELS_EN[val] ?? val]
          : [key, localizeValue(val)]
      )
    );
  }
  return value;
};

// Deep-clone + translate for `en`; return the original (Czech) schema unchanged for every other
// locale. `en-US`, `en-GB`, … all match.
const localizeSchema = <T>(schema: T, locale?: string): T =>
  locale?.toLowerCase().startsWith('en') ? (localizeValue(schema) as T) : schema;

// ----------------------------------------------------------------------------
// Mock SchemaProvider — resolves the hand-authored schemas above by url, localized to the requested
// `meta.locale` (Czech by default, English for `en`).
// ----------------------------------------------------------------------------

// A backend fills every action slot its author left unset with a `DefaultActions` entry; the mock
// schemas above set only what differs, and this adds the rest the same way.
const DEFAULT_ACTIONS: AnyActionDescriptor[] = [{type: 'default_actions'}];
const ROW_DEFAULT_ACTIONS: AnyActionDescriptor[] = [{type: 'default_actions', scope: 'detail'}];
const LIST_DEFAULT_ACTIONS: AnyActionDescriptor[] = [{type: 'default_actions', scope: 'list'}];

const withBoxDefaults = (box: BoxSchema): BoxSchema => ({
  ...box,
  boxes: box.boxes?.map((item) => (item.type === 'field' ? item : withBoxDefaults(item))),
  ...(box.list
    ? {
        list: {
          ...box.list,
          rowActions: box.list.rowActions ?? ROW_DEFAULT_ACTIONS,
          listActions: box.list.listActions ?? LIST_DEFAULT_ACTIONS,
        },
      }
    : {}),
});

const withBackendDefaults = (schema: LocalResourceSchema): LocalResourceSchema => ({
  ...schema,
  views: schema.views.map((view) =>
    view.type === 'list'
      ? {
          ...view,
          list: {
            ...view.list,
            rowActions: view.list?.rowActions ?? ROW_DEFAULT_ACTIONS,
            toolbarActions: view.list?.toolbarActions ?? DEFAULT_ACTIONS,
          },
        }
      : {
          ...view,
          ...(view.detail
            ? {
                detail: {
                  ...view.detail,
                  box: withBoxDefaults(view.detail.box),
                  toolbarActions: view.detail.toolbarActions ?? DEFAULT_ACTIONS,
                },
              }
            : {}),
        }
  ),
});

const RESOURCE_SCHEMA_BY_URL: Record<string, LocalResourceSchema> = {
  [PROPERTIES_URL]: withBackendDefaults(PROPERTY_RESOURCE_SCHEMA),
  [OWNERS_URL]: withBackendDefaults(OWNER_RESOURCE_SCHEMA),
  [DOCUMENTS_URL]: withBackendDefaults(DOCUMENT_RESOURCE_SCHEMA),
  [PAYMENTS_URL]: withBackendDefaults(PAYMENT_RESOURCE_SCHEMA),
  [PHOTOS_URL]: withBackendDefaults(PHOTO_RESOURCE_SCHEMA),
};

export const mockSchemaProvider: SchemaProvider = {
  getServiceSchema: (_serviceName, _serviceUrl, params) =>
    Promise.resolve(localizeSchema(SERVICE_SCHEMA, params?.meta?.locale)),
  getRecordSchema: (resourceUrl, _actionName, _recordId, params) => {
    const schema = RESOURCE_SCHEMA_BY_URL[resourceUrl];
    if (!schema) return Promise.reject(new Error(`No mock schema for ${resourceUrl}`));
    return Promise.resolve(localizeSchema(schema, params?.meta?.locale));
  },
  listPreferences: () => Promise.resolve({}),
  setPreference: () => Promise.resolve(),
  deletePreference: () => Promise.resolve(),
  deleteAllPreferences: () => Promise.resolve(),
};

// ----------------------------------------------------------------------------
// Mock ServiceDataProvider — ra-data-fakerest for CRUD, decorated with the `meta`
// sidecar every HabRecord carries (`repr` powers recordRepresentation / relation labels).
// ----------------------------------------------------------------------------

const REPR: Record<string, (record: Record<string, unknown>) => string> = {
  [PROPERTIES_RESOURCE]: (record) => String(record.address ?? ''),
  [OWNERS_RESOURCE]: (record) => String(record.full_name ?? ''),
  [DOCUMENTS_RESOURCE]: (record) => String(record.title ?? ''),
  [PAYMENTS_RESOURCE]: (record) => `Platba ${record.variable_symbol ?? ''}`.trim(),
  [PHOTOS_RESOURCE]: (record) => String(record.caption ?? ''),
};

// Only properties and owners carry the standard detail / edit / delete row actions. Payments carry
// just `mark_paid` — no row-action buttons of their own, but the entry is what lets the list's
// `mark_paid` *field* column resolve its schema (`SchemaActionField` reads `record.meta.schema`).
const RECORD_ACTIONS_BY_RESOURCE: Record<string, ResourceActionSchema[]> = {
  [PROPERTIES_RESOURCE]: PROPERTY_RECORD_ACTIONS,
  [OWNERS_RESOURCE]: OWNER_RECORD_ACTIONS,
  [PAYMENTS_RESOURCE]: PAYMENT_RECORD_ACTIONS,
};

// The per-record `meta.schema.actions` are what the row-action buttons and the detail toolbar read
// (Detail / Upravit / Smazat / Nahlásit závadu, incl. the delete confirm dialog). They come from the
// *data* endpoint, so — mirroring a real backend — they are localized to the request's `locale`
// (threaded in as `params.meta.locale` by the data views, see HAB-782), not the store. This is why a
// language switch, which changes each data query's key and refetches, flips the action labels too.
const decorate = (
  resource: string,
  record: Record<string, unknown>,
  locale?: string
): HabRecord => {
  const resourceName = resource.split('/')[1] ?? resource;
  const actions = RECORD_ACTIONS_BY_RESOURCE[resource] ?? [];
  const meta: RecordMeta = {
    schema: {name: resourceName, pkFieldName: 'id', actions: localizeSchema(actions, locale)},
    repr: REPR[resource]?.(record) ?? String(record.id ?? ''),
    tags: [],
  };
  return {...record, meta} as HabRecord;
};

/**
 * Fresh mock data provider per shell mount (each story starts from a clean, isolated data set).
 * Wraps `ra-data-fakerest` and decorates every read/write result with the `meta` sidecar; the
 * habarico `callAction` / `search` / `aggregate` extensions are stubbed (unused by these stories).
 */
export const createMockDataProviderFactory =
  () =>
  (_servicesSchema: ServicesSchema): ServiceDataProvider => {
    const base: DataProvider = fakeDataProvider(
      {
        // Inject the nested `contact` object here so each property carries the object the `object`
        // detail box (Kontakt tab) reads, without hand-writing it on all eight fixtures above.
        [PROPERTIES_RESOURCE]: PROPERTIES.map((property) => ({
          ...property,
          contact: {
            email: `sprava+${property.id}@example.com`,
            phone: `+420 700 000 0${property.id}`,
          },
          bank_account: `${123456789 + property.id}/0800`,
        })),
        [OWNERS_RESOURCE]: OWNERS.map((owner) => ({...owner})),
        [DOCUMENTS_RESOURCE]: DOCUMENTS.map((document) => ({...document})),
        [PAYMENTS_RESOURCE]: PAYMENTS.map((payment) => ({...payment})),
        [PHOTOS_RESOURCE]: PHOTOS.map((photo) => ({...photo})),
      },
      false
    );

    // `locale` is threaded in by the data views as `params.meta.locale` (HAB-782); the decorate step
    // localizes each record's `meta.schema.actions` with it, so action labels follow the language.
    const mapList = async <T extends {data: Record<string, unknown>[]}>(
      resource: string,
      promise: Promise<T>,
      locale?: string
    ) => {
      const result = await promise;
      return {...result, data: result.data.map((record) => decorate(resource, record, locale))};
    };
    const mapOne = async <T extends {data: Record<string, unknown>}>(
      resource: string,
      promise: Promise<T>,
      locale?: string
    ) => {
      const result = await promise;
      return {...result, data: decorate(resource, result.data, locale)};
    };

    return {
      ...base,
      getList: (resource, params) =>
        mapList(resource, base.getList(resource, params), params.meta?.locale),
      getMany: (resource, params) =>
        mapList(resource, base.getMany(resource, params), params.meta?.locale),
      getManyReference: (resource, params) =>
        mapList(resource, base.getManyReference(resource, params), params.meta?.locale),
      getOne: (resource, params) =>
        mapOne(resource, base.getOne(resource, params), params.meta?.locale),
      create: (resource, params) =>
        mapOne(resource, base.create(resource, params), params.meta?.locale),
      update: (resource, params) =>
        mapOne(resource, base.update(resource, params), params.meta?.locale),
      delete: (resource, params) =>
        mapOne(resource, base.delete(resource, params), params.meta?.locale),
      // The `delete` row action and the payment list's `mark_paid` field action are `resource`
      // actions; execute both against the fakerest store so the row really disappears / really
      // settles after confirming. `useCallAction` refreshes the list on success, so `mark_paid`
      // closes its own loop: the status chip flips to Uhrazeno and the button's `showQuery` then
      // hides it. Everything else is a stubbed success (the other habarico action extensions are
      // unused by these stories).
      callAction: async (resource, method, path, params) => {
        if (method === 'delete' && params?.id != null) {
          await base.delete(resource, {id: params.id, previousData: {id: params.id}});
        }
        if (path === 'mark_paid' && params?.id != null) {
          await base.update(resource, {
            id: params.id,
            data: {status: 'Uhrazeno', paid_on: new Date().toISOString().slice(0, 10)},
            previousData: {id: params.id},
          });
          return {data: {meta: {state: 'success', message: 'Platba byla označena jako uhrazená'}}};
        }
        return {data: {meta: {state: 'success', message: 'Hotovo'}}};
      },
      // Backend export stub — a tiny CSV blob so the ExportButton flow (blob download) works in stories
      export: (resource, params) =>
        Promise.resolve({
          status: 200,
          blob: new Blob(['id\n1\n'], {type: 'text/csv'}),
          filename: `${resource.replace('/', '_')}.${params.format}`,
        }),
    } as ServiceDataProvider;
  };

// ----------------------------------------------------------------------------
// Mock ServiceAuthProvider — resolves auth immediately so the shell renders the resource
// view directly (no login screen); the extra service operations are stubbed.
// ----------------------------------------------------------------------------

const IDENTITY = {id: 1, fullName: 'Martina Nováková', firstName: 'Martina', lastName: 'Nováková'};

export const mockAuthProvider: ServiceAuthProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
  getIdentity: () => Promise.resolve(IDENTITY),
  resetPassword: () => Promise.resolve(),
  setPassword: () => Promise.resolve(new Response()),
  isAuthenticated: () => true,
  updateIdentity: () => Promise.resolve(new Response()),
  changePassword: () => Promise.resolve(),
  verifyMfa: () => Promise.resolve(new Response()),
  requestMfaChallenge: () => Promise.resolve({} as never),
  getAuthHeaders: () => ({}),
};

export const PROPERTY_ENTRY = `/${PROPERTIES_RESOURCE}`;
