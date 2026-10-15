---
title: Response Field Selection
sidebar_position: 11
---

Both the detail endpoint (`GET /{resource}/:id`) and the list endpoint (`GET /{resource}?...`)
accept a `fields` query param that trims which top-level keys are returned. Without it, the
response is unchanged — every readable field plus the full `meta` object:

```http
GET /products/1?fields=id,name
```

```json
{ "id": 1, "name": "Wireless Mouse" }
```

## Selecting `meta`

`meta` — the [`ResourceObjectMeta`](/api) accompanying every record (representation, schema, tags,
trigger action) — is itself a selectable field. Request it like any other, or narrow its contents
with `meta(...)`:

```http
GET /products/1?fields=id,meta(repr,tags)
```

```json
{ "id": 1, "meta": { "repr": "Wireless Mouse", "tags": [] } }
```

`meta.schema` supports the same nested syntax, one level deeper — `meta(schema(name,label))`.

| Level | Selectable fields |
|---|---|
| `meta` | `repr`, `schema`, `tags`, `trigger_action` |
| `meta.schema` | `name`, `label`, `pk_field_name`, `actions` |

## Wildcards

Two wildcards are available, usable at any level — top level or inside `meta(...)` /
`meta(schema(...))`:

| Wildcard | Effect |
|---|---|
| `__all__` | Return every field at that level. Replaces the rest of the request at that level — mixing it with explicit names has no extra effect. |
| `__default__` | Return the default fields at that level, same as omitting `fields` — merged with anything else requested alongside it. `fields=__default__,meta(schema)` returns everything plus forces the (already-included) `schema` key. |

## Errors

Requesting an unknown field, at any level, fails the whole request with `422 Unprocessable
Entity` (the standard Eluvia error envelope, `source` pointing at the offending field name):

```http
GET /products/1?fields=bogus
```

```json
{
  "errors": [
    { "message": "Unknown field.", "error": "Unprocessable Entity", "status": 422, "source": "bogus", "timestamp": "..." }
  ]
}
```

## On the list endpoint

`fields` applies uniformly to every row. `meta.highlights` (the [global search](./global-search.md)
sidecar) is not governed by `fields` — it is added after field selection whenever a search is
active, regardless of whether `meta(...)` was narrowed to exclude it.

:::caution
Nested selection currently only applies to `meta` / `meta.schema` — plain data fields don't support
`fields=category(name)`-style nesting yet. A `belongs_to` / `has_one` field always serializes to
its foreign key, not an expandable object.
:::

## See also

- [Global search](./global-search.md) — the `highlights` sidecar riding alongside `meta`
- [Schema model](/concepts/schema-model) — where `ResourceObjectMeta` sits among the other schemas
- [API reference](/api) — the full shape of a resource response
