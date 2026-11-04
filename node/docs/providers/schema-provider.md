---
title: Schema provider
sidebar_position: 4
---

Fetches the schemas the whole admin is generated from.

`getSchemaProvider` builds one from a function returning auth headers. Replace it only when the
schemas come from somewhere other than the Habarico REST endpoints — a static bundle in tests, or
a gateway that reshapes them.

## Signature

```typescript
type SchemaProvider = {
  getServiceSchema: (serviceName, serviceUrl, params?) => Promise<ServiceSchema>;
  getRecordSchema: (resourceUrl, actionName?, recordId?, params?) => Promise<LocalResourceSchema>;

  // optional — backend-synced preferences
  listPreferences?: (serviceUrl) => Promise<Record<string, unknown>>;
  setPreference?: (serviceUrl, key, value) => Promise<void>;
  deletePreference?: (serviceUrl, key) => Promise<void>;
  deleteAllPreferences?: (serviceUrl) => Promise<void>;
};
```

```typescript
import {getSchemaProvider} from 'habarico';

const schemaProvider = getSchemaProvider(() => ({
  Authorization: `Bearer ${getAccessToken()}`,
}));
```

## Methods

| Method | Request | Returns |
|---|---|---|
| `getServiceSchema` | `GET {serviceUrl}/schema/` | Every resource of the service; each gets its `url` filled in and relative upload URLs resolved |
| `getRecordSchema` | `GET {resourceUrl}[{id}/][{action}/]schema/` | One resource's schema — per record and per action when asked |

The locale travels as an `Accept-Language` header, so labels and help texts arrive translated.

The provider returns every `ResourceReference` as the backend sent it, so a reference to the
schema's own service has no `service`. The hooks that call the provider fill it in, which is why a
custom provider does not have to.

## Wiring it

`getSchemaProvider` **is** the factory `schemaProviderFactory` expects — `SchemaAdmin` calls it as
`schemaProviderFactory(authProvider.getAuthHeaders)`. It is the default, so an application using the
built-in provider passes nothing.

## Extending it

A package extending the library supplies a factory of its own. `habarico-enterprise` returns this
provider plus `getAggregateSchema` (`GET {resourceUrl}aggregate/schema/`, which fields may be
grouped and aggregated) — the endpoint only a paid backend serves:

```tsx
<SchemaAdmin schemaProviderFactory={getEnterpriseSchemaProvider} … />
```

There is one schema provider, not a base and an extension: an application wires either the built-in
factory or the paid one. Code reading a paid method therefore treats it as possibly absent, and a
missing method means that feature is unavailable rather than broken.

`useSchemaProvider` is what expresses that. The built-in methods are always present; the type
argument adds the contributed ones as optional:

```ts
const {getAggregateSchema} = useSchemaProvider<EnterpriseSchemaProvider>();
if (!getAggregateSchema) {
  // the free provider is wired — report the feature unavailable
}
```

## User preferences

The four optional methods back the
[backend-synced preferences store](../utilities/create-backend-store-backend-synced-preferences.md):

| Method | HTTP |
|---|---|
| `listPreferences` | `GET {serviceUrl}/user-preferences/` |
| `setPreference` | `PUT {serviceUrl}/user-preferences/{key}/` |
| `deletePreference` | `DELETE {serviceUrl}/user-preferences/{key}/` |
| `deleteAllPreferences` | `DELETE {serviceUrl}/user-preferences/` |

On the wire the backend answers `listPreferences` with `Array<{key, value}>`; the provider turns
it into the `Record<string, unknown>` the method resolves with.

:::tip
A custom provider may leave all four out. Backend sync then switches off silently and preferences
stay in localStorage — which is also what happens when the backend has the preferences app
disabled and answers `404`.
:::

## See also

- [SchemaAdmin](../base-components/schema-admin.md) — where the provider is passed in
- [useGetLocalResourceSchema](../hooks/use-get-local-resource-schema.md) — the hook built on `getRecordSchema`
- [Service and resource schema](../types-and-schemas/service-schema-and-resource-schema.md) — the returned shapes
- [User preferences](/python/user-preferences/) — the backend side
