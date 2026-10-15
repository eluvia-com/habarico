---
title: Habarico for React
sidebar_position: 1
---

`@eluvia/habarico` is the React frontend of Habarico. It fetches the JSON schemas a Habarico
backend exposes and renders a complete admin interface from them at runtime — lists, detail pages,
forms, actions and menus — without hand-written screens per resource. It is built on
[React Admin](https://marmelab.com/react-admin/) 5.14, MUI v7 and MUI X v9, and runs on React 18
or 19.

Every part of the generated UI can be replaced: register your own field, input, button or box
implementation and the schema-driven renderer will use it wherever that type appears.

## Where to start

| Page | What it covers |
| --- | --- |
| [Installation](./installation.mdx) | Packages, the router requirement and local development |
| [Base components](./base-components/index.md) | `SchemaAdmin` and `SchemaResource` — the entry points |
| [View components](./view-components/index.md) | List, show, create, edit and action views |
| [Box components](./box-components/index.md) | The layout containers a view is built from |
| [Providers](./providers/index.md) | Auth, data and schema providers, and the customisation registries |
| [Input components](./input-components/index.md) / [Field components](./field-components/index.md) | Every built-in input and field type |
| [Types and schemas](./types-and-schemas/index.md) | The shape of the schemas the backend sends |
| [Complete example](./complete-example.md) | One admin from entry point to a customised field |

The schemas come from either the [Python](/python/intro) or the [Ruby](/ruby/intro) library — both
speak the same [contract](/api), so this frontend works against either one.

New to Habarico? Start with the [Quickstart](/concepts/guides/quickstart), which sets up a backend
and this frontend together.
