import fakeDataProvider from 'ra-data-fakerest';
import type {DataProvider} from 'react-admin';

/**
 * Story-support fixtures for the admin-layer page harness (HAB-668). Standalone — the admin
 * stories deliberately keep their own data set (they do not share `design/pages`' mock), so the
 * layer's "React Admin runs on its own" test stays self-contained. Seeds an in-memory
 * `ra-data-fakerest` data provider with two resources: `properties` and their `owners`.
 */

export type Owner = {
  id: number;
  title_before: string;
  first_name: string;
  surname: string;
  title_after: string;
  full_name: string;
  email: string;
  phone: string;
};

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
  // edit-form fields
  residential: boolean;
  unit_number: string;
  floor_number: number;
  floor_count: number;
  barrier_free: boolean;
  heating: string;
  note: string;
};

export const OWNERS: Owner[] = [
  {
    id: 1,
    title_before: '',
    first_name: 'Jiří',
    surname: 'Daněk',
    title_after: '',
    full_name: 'Jiří Daněk',
    email: 'jiri.danek@example.com',
    phone: '+420 601 111 222',
  },
  {
    id: 2,
    title_before: '',
    first_name: 'Eva',
    surname: 'Vohralíková',
    title_after: '',
    full_name: 'Eva Vohralíková',
    email: 'eva.v@example.com',
    phone: '+420 602 333 444',
  },
  {
    id: 3,
    title_before: '',
    first_name: 'Gabriela',
    surname: 'Bendová',
    title_after: '',
    full_name: 'Gabriela Bendová',
    email: 'gabriela.b@example.com',
    phone: '+420 603 555 666',
  },
  {
    id: 4,
    title_before: 'Ing.',
    first_name: 'Jan',
    surname: 'Mareš',
    title_after: '',
    full_name: 'Ing. Jan Mareš',
    email: 'jan.mares@example.com',
    phone: '+420 604 777 888',
  },
  {
    id: 5,
    title_before: '',
    first_name: 'Miroslav',
    surname: 'Bureš',
    title_after: '',
    full_name: 'Miroslav Bureš',
    email: 'm.bures@example.com',
    phone: '+420 605 999 000',
  },
  {
    id: 6,
    title_before: '',
    first_name: 'Petra',
    surname: 'Nováková',
    title_after: '',
    full_name: 'Petra Nováková',
    email: 'petra.n@example.com',
    phone: '+420 606 121 314',
  },
];

export const PROPERTIES: Property[] = [
  {
    id: 1,
    type: 'Flat',
    address: 'Kyjovská 578/13, Prague – Michle',
    layout: '2 + 1',
    area: 52,
    owner_id: 1,
    involvement: 'let / manage',
    complete: true,
    active: true,
    residential: true,
    unit_number: '578/13',
    floor_number: 3,
    floor_count: 6,
    barrier_free: false,
    heating: 'District',
    note: '',
  },
  {
    id: 2,
    type: 'House',
    address: 'Karla Čapka 841, Nýrsko',
    layout: '5 + 1',
    area: 180,
    owner_id: 2,
    involvement: 'let / manage',
    complete: true,
    active: true,
    residential: true,
    unit_number: '841',
    floor_number: 1,
    floor_count: 2,
    barrier_free: false,
    heating: 'Central',
    note: '',
  },
  {
    id: 3,
    type: 'Flat',
    address: 'Baarova 2670/13, Prague – Michle',
    layout: '2 + kk',
    area: 48,
    owner_id: 3,
    involvement: 'manage',
    complete: false,
    active: true,
    residential: true,
    unit_number: '2670/13',
    floor_number: 2,
    floor_count: 5,
    barrier_free: false,
    heating: 'District',
    note: 'Profile incomplete.',
  },
  {
    id: 4,
    type: 'Flat',
    address: 'Vrchlického 3025/11, Prague – Michle',
    layout: '2 + 1',
    area: 55,
    owner_id: 4,
    involvement: 'let / manage',
    complete: true,
    active: true,
    residential: true,
    unit_number: '3025/11',
    floor_number: 4,
    floor_count: 8,
    barrier_free: true,
    heating: 'District',
    note: '',
  },
  {
    id: 5,
    type: 'Land',
    address: 'Čechova 2125/27, Prague – Východ',
    layout: '—',
    area: 640,
    owner_id: 5,
    involvement: 'manage',
    complete: true,
    active: false,
    residential: false,
    unit_number: '2125/27',
    floor_number: 0,
    floor_count: 0,
    barrier_free: false,
    heating: 'None',
    note: 'Inactive.',
  },
  {
    id: 6,
    type: 'Flat',
    address: 'Blatenská 719/28, Prague – Lobzy',
    layout: '1 + 1',
    area: 38,
    owner_id: 6,
    involvement: 'let / manage',
    complete: true,
    active: true,
    residential: true,
    unit_number: '719/28',
    floor_number: 1,
    floor_count: 4,
    barrier_free: false,
    heating: 'Local',
    note: '',
  },
  {
    id: 7,
    type: 'Apartment',
    address: 'Smetanova 210/7, Prague – Smíchov',
    layout: '3 + kk',
    area: 76,
    owner_id: 4,
    involvement: 'let / manage',
    complete: false,
    active: true,
    residential: true,
    unit_number: '210/7',
    floor_number: 5,
    floor_count: 6,
    barrier_free: true,
    heating: 'District',
    note: '',
  },
  {
    id: 8,
    type: 'Flat',
    address: 'Janská 5680/2, Prague – Sever',
    layout: '2 + kk',
    area: 46,
    owner_id: 5,
    involvement: 'let / manage',
    complete: true,
    active: true,
    residential: true,
    unit_number: '5680/2',
    floor_number: 2,
    floor_count: 7,
    barrier_free: false,
    heating: 'District',
    note: '',
  },
];

export const PROPERTY_TYPES = ['Flat', 'House', 'Apartment', 'Land'];
export const INVOLVEMENTS = ['let / manage', 'manage', 'let'];
export const HEATING_OPTIONS = ['District', 'Central', 'Local', 'None'];
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

/**
 * Fresh in-memory data provider seeded with the fixtures above. Created per shell mount so each
 * story starts from a clean, isolated data set (edits in one story never bleed into another).
 */
export const createFakeDataProvider = (): DataProvider =>
  fakeDataProvider(
    {
      properties: PROPERTIES.map((property) => ({...property})),
      owners: OWNERS.map((owner) => ({...owner})),
    },
    false
  );
