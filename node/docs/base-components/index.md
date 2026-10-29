---
title: Base components
sidebar_position: 1
---

The two components that bootstrap an admin application: `SchemaAdmin` mounts the whole admin and
fetches the service schema, `SchemaResource` declares one resource inside it. Both carry the
project's own look for its fields, which no schema describes.

| Page | What it covers |
| --- | --- |
| [SchemaAdmin](./schema-admin.md) | Props, service config map and extra menu items |
| [fieldDefaults](./field-defaults.md) | The shape each kind of field takes across the project |
| [SchemaRootContextProvider](./schema-root-context-provider.md) | Assembling the admin by hand instead |
| [SchemaResource](./schema-resource.md) | Registering a resource and overriding its views |

`SchemaSubResource` is exported alongside them, but it is a routing element: the generated router
mounts it for a resource opened *inside* another one (`/eshop/customer/42/orders`), so that the
inner resource knows which record it was reached from. You do not place it yourself.
