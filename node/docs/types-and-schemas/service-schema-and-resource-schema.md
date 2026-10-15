---
title: Service and resource schema
sidebar_position: 2
---

Two layers describe a backend: a light list of everything a service offers, loaded once, and the
full schema of one resource fetched when it is opened.

The split is what keeps the admin fast — the menu and the routes come from the global layer, and
the heavy per-resource detail is requested only when needed.

## ServiceSchema

Returned by `GET {serviceUrl}/schema/`; drives the menu and the routing.

```typescript
type ServiceSchema = GlobalResourceSchema[];

// Global (lightweight) resource descriptor — used for the menu and for routing
type GlobalResourceSchema = {
  name: string;                        // Bare resource name without the service, e.g. "product"
  pkFieldName: string;                 // Primary key field name
  label: string;                       // Human-readable label
  url: string;                         // API endpoint base URL
  menu?: MenuSchema;
  views: GlobalViewSchema[];
  actions: GlobalResourceActionSchema[];
  globalFulltextSearchEnabled?: boolean;
};

// A paid backend sends two more keys on a resource — `aggregateEnabled` (the resource exposes the
// aggregate endpoint) and `dashboardEnabled` (it may back dashboard widgets). They are typed by
// `habarico-enterprise` on `DashboardResourceSchema`; no free backend emits either.

// Enough to route to a view and know how it opens — no fields, no boxes
type GlobalViewSchema = {
  name: string;
  type: ViewType;
  isDetail: boolean;
  endpoint: ViewEndpointParameters;
  mode?: ViewModeType;                 // default presentation mode; absent falls back to 'redirect'
};

type GlobalResourceActionSchema = {
  name: string;
  type: string;
  showInList: boolean;
  showInDetail: boolean;
  isDetail: boolean;
};
```

## LocalResourceSchema

Returned by `GET {resourceUrl}[{id}/][{action}/]schema/`; drives one resource's screens.

```typescript
type LocalResourceSchema = {
  name: string;
  pkFieldName: string;
  url: string;
  views: ViewSchema[];
  actions: ResourceActionSchema[];
  endpoints: EndpointsSchema;          // Supported HTTP methods and their fields / filters
};

type ResourceActionSchema = ActionSchema & {
  name: string;
  showInList: boolean;
  showInDetail: boolean;
};

type EndpointsSchema = Record<RequestMethodType, MethodSchema>;

type MethodSchema = {
  fields: FieldSchema[];
  filters?: FilterSchema[];
};
```

:::tip
Requested with a record id, this schema is *per record*: fields can be read-only, actions can be
absent, boxes can differ. That is where per-record permissions live — the frontend does not hide
anything, it simply never receives it.
:::

The two layers are read by separate hooks — `useGetGlobalResourceSchema` /
`useGlobalResourceSchemaContext` for the global one (its context exposes `getGlobalViewSchema`),
`useGetLocalResourceSchema` for the local one (`getViewSchema`). See
[Schema lookup hooks](../hooks/schema-lookup-hooks.md).

## Menu schema

The menu is not a separate endpoint — each global resource carries its own entry, and the entries
are grouped by their `parent` chain.

```typescript
type MenuType = 'view' | 'link' | 'text';

type MenuGroupSchema = {
  name: string;
  label: string;
  priority: number;
  icon?: string;
  color?: ColorType;
  parent?: MenuGroupSchema;
};

type MenuSchema = MenuGroupSchema & {
  type: MenuType;
  view?: ViewActionParameters;
  link?: LinkActionParameters;
};
```

## Records

Every record the data provider returns carries a `meta` sidecar — the per-record schema (which
actions this record allows), its display representation, and the search highlights when the row
came from a search.

```typescript
type HabRecord = RaRecord & {
  id: Identifier;
  meta: RecordMeta;
};

type RecordMeta = {
  schema: {name: string; pkFieldName: string; actions: ResourceActionSchema[]};
  repr: string;                        // Display representation of the record
  tags: string[];
  triggerAction?: ActionSchema;        // Action to run right after the record is loaded
  highlights?: SearchObjectHighlight[];
};
```

## Multiple services

`ServicesSchema` is a map of service name to `ServiceSchema`. One admin can talk to several
backends at once; the resource name carries the service, which is why resources are addressed as
`"service/resource"` everywhere in the API.

```typescript
type ServicesSchema = {[name: string]: ServiceSchema};
```

## See also

- [FieldSchema](./field-schema.md) — the fields inside a view
- [ViewSchema and ActionSchema](./view-schema-and-action-schema.md) — the views and actions above
- [SchemaProvider](../providers/schema-provider.md) — what fetches these
- [REST API reference](/api) — the endpoints and their exact payloads
