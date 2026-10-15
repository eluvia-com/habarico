---
title: Types and schemas
sidebar_position: 1
---

The wire format between backend and frontend. Everything the admin renders is derived from these
shapes, so they are the contract to check when a screen does not look the way the backend
intended.

| Page | What it covers |
| --- | --- |
| [Service and resource schema](./service-schema-and-resource-schema.md) | What a service exposes, and what one resource can do |
| [FieldSchema](./field-schema.md) | One field: type, format and options |
| [ViewSchema and ActionSchema](./view-schema-and-action-schema.md) | Views, boxes and actions |

The authoritative definition is `contract/openapi.yaml` in the monorepo, rendered as the
[REST API reference](/api). The types here are the TypeScript view of the same contract.

## See also

- [How it works](/concepts/how-it-works) — how a request turns into a screen
- [useGetLocalResourceSchema](../hooks/use-get-local-resource-schema.md) — reading these shapes at runtime
