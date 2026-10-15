---
title: Basic usage
sidebar_position: 1
---

A Habarico resource is a controller that includes the engine's concern and declares what the
frontend may do with the underlying model: which records to load, who may read or change them,
which fields exist and which views are available.

The pages in this section follow the order in which a resource is usually built up:

| Page | What it covers |
| --- | --- |
| [Controller setup](./controller-setup.md) | The minimal working resource |
| [Context object](./context-object.md) | What the request context carries |
| [Permissions](./permissions.md) | Read/create/update/delete rules |
| [Data loading](./data-loading.md) | Scopes, eager loading and record lookup |
| [Field types](../field-types.md) | Declaring the fields a resource exposes, and the types they get |
| [Views](./views.md) | List, show, create, edit and their layouts |
| [Custom schema generators](./custom-schema-generators.md) | Taking over schema generation |
| [Global search](./global-search.md) | Cross-resource search |
| [Aggregation](./aggregation.md) 🔒 | The `/aggregate` endpoint feeding charts and dashboard widgets — paid |
| [Response field selection](./response-field-selection.md) | Trimming a response to the fields a caller needs with `?fields=` |
