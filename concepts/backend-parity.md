---
title: Python and Ruby parity
sidebar_position: 4
---

The two backends implement the same contract, but not the same feature set. This page says which
half of the frontend works against which backend, so a choice made here does not turn into a
surprise later.

## Core: identical

Everything the generated admin is made of works the same on both sides:

| Feature | Python | Ruby |
|---|---|---|
| Resource, view and menu schemas | ✅ | ✅ |
| List / show / create / edit views | ✅ | ✅ |
| Boxes — simple, grid, tab, wizard, list, gallery, object, array | ✅ | ✅ |
| Custom and confirmed actions, action views | ✅ | ✅ |
| Filters, ordering, fulltext search with highlights | ✅ | ✅ |
| Diacritics-insensitive search | `ADMIN_SEARCH_UNACCENT_ENABLED` | `search_unaccent_enabled` |
| Per-record permissions | ✅ | ✅ |
| ID-based read without `can_read` | — (write a custom permission class) | [`allow_read_by_id`](/ruby/basic-usage/permissions) |
| Change history (paid) | [django-reversion](/python/change-history-reversion) | [PaperTrail](/ruby/change-history-paper-trail) |
| Cross-service references | [`AdminUUIDRelatedField`](/python/basic-usage/custom-administration-fields) | [Cross-service references](/ruby/cross-service-references) |
| Rich text tokens | ✅ | ✅ |
| Image upload actions | ✅ | ✅ |
| [User preferences](/python/user-preferences/) — the `user-preferences` endpoints | ✅ | ✅ ([contrib module](/ruby/user-preferences)) |
| Global search (paid) | [✅](/python/filtering-and-searching/global-search) | [✅](/ruby/basic-usage/global-search) |
| Aggregations (paid) — the `/aggregate` endpoint | [✅](/python/aggregations/) | [✅](/ruby/basic-usage/aggregation) |
| `dashboard_enabled` on a resource (paid) | [✅](/python/dashboard) | ✅ (`dashboard_enabled` in the DSL) |
| Dashboard widget whitelist (paid) — `dashboard_fields`, `dashboard_filters` and the `/dashboard/schema` endpoint, including one-hop relation paths (`a__b`) | [✅](/python/dashboard) | [✅](/ruby/dashboard) |
| [Chunked uploads](/python/chunked-uploads/) (paid) — TUS / S3 multipart | ✅ | ✅ ([paid gem](/ruby/chunked-uploads/)) |

:::caution
The two aggregate implementations answer the same contract but not on any database: both truncate
dates and bucket numbers through PostgreSQL-specific SQL. The Ruby side also reads `group_by`
straight from the query string, because Rails' parameter parser keeps only the last value of a
repeated key.
:::

:::caution
Chunked uploads answer the same field schema (`options.upload`) on both sides, but not the same
storage model. Python resolves a provider **per field** against that field's own storage, so a
model with fields on different storages can use S3 for one and tus for another; Ruby resolves a
**single** provider for the whole app, from its one default `ActiveStorage` service. Both wire
their upload endpoints in automatically once the package is installed.
:::

## Python only

One subsystem exists only in the Django library. The frontend components that consume it are
documented without a Ruby counterpart, because there is none:

| Feature | What needs it on the frontend |
|---|---|
| [AI integration](/python/ai-integration/) (paid) — the prediction and assistant endpoints | [SchemaPredictiveTextInput](/node/input-components/predictive-text-input), [SchemaAiAssistantButton](/node/utilities/ai-assistant-button) |

This does not break a Ruby-backed admin — the frontend degrades instead: the AI components are
only rendered for a field the schema marks as AI-backed, which a Ruby resource does only when its
DSL declares the `ai` format (see the caution below).

The same degradation applies to a resource that simply leaves the aggregation off: the endpoint
answers `404` and [useAggregate](/node/hooks/use-aggregate) reports `isUnsupported` rather than an
error, whichever backend serves it.

## Enum coverage

The Ruby enum lists are behind the contract on two points, so a schema key the Python library can
emit is rejected by the Ruby schema validation:

| Enum | Missing in Ruby |
|---|---|
| `ActionType` | `ai-assistant`, `export` |
| `FieldFormatType` | `decimal`, `tree-relation`, `czech-id-card-number` |

The frontend understands all of them — the gap is on the emitting side only.

:::caution
The AI field options are the exception worth knowing about: the Ruby DSL accepts `ai_source_fields`
and a field `format` of `ai`, so a schema can *look* AI-enabled. What Ruby has no equivalent of is
the endpoint behind it — the `prediction/` route and the `ai-assistant` action — so the input
renders and then fails at request time. Declare those formats only against a Python backend, or
implement the routes yourself.
:::

## What this means for a migration

[How it works](./how-it-works.md) says the same frontend build works against either backend. That
holds for the generated admin — lists, forms, actions, menus, permissions, backend-synced
preferences, the aggregate endpoint the dashboard widgets read, and chunked uploads (with
`habarico-enterprise`, picking a single provider, per the caution above). It does not
hold for the AI features: moving a service from Django to Rails means giving them up or
reimplementing their endpoints, and the enums above mean a field format or action type the Django
schema emits may have no Ruby equivalent to move to.

Going the other way — Rails to Django — adds AI integration. The AI components ship in
`@eluvia/habarico-enterprise`, so the frontend needs that package; beyond it, nothing changes,
because the feature is switched on by a flag or an endpoint the frontend already looks for.

## See also

- [How it works](./how-it-works.md) — the contract both backends implement
- [Python library](/python/intro) / [Ruby library](/ruby/intro) — the two implementations
- [API reference](/api) — the endpoints, including the optional groups
