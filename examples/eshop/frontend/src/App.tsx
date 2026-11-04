import {SchemaAdmin, SchemaResource} from 'habarico';
import {authProvider} from './auth';

const SERVICES = {
  eshop: {url: '/api/admin', label: 'E-shop', syncPreferences: true},
} as const;

const LANGUAGES = [{title: 'English', locale: 'en-US'}];

export const App = () => (
  <SchemaAdmin authProvider={authProvider} serviceConfigMap={SERVICES} availableLanguages={LANGUAGES}>
    <SchemaResource name="eshop/product" />
    <SchemaResource name="eshop/category" />
    <SchemaResource name="eshop/order" />
    <SchemaResource name="eshop/customer" />
  </SchemaAdmin>
);
