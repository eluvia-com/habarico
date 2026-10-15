---
title: View and Action URLs
sidebar_position: 11
---

The schema does **not** contain browser (SPA) URLs. Each view and each `view` action only carries
enough information for the frontend to build the URL itself: the view `type`, the `is_detail` flag,
an optional `action_name` (for non-standard views) and, for detail targets, the record's primary key.
The frontend derives the route from that data using the convention below. This is a **shared contract**
between the backend (which emits the schema) and the frontend (which builds the routes), so both sides
must agree on it.

> The `endpoint` object on a view/action is the **REST API** endpoint (the data source, e.g.
> `GET /admin/product/1/`). It is unrelated to the browser route described here.

## Reserved view names

The names `list`, `create`, `edit` and `show` are **reserved**: both the backend and the frontend
know them and map them to fixed, short browser routes. Any other view is addressed generically by its
`action_name`. Reserved views are recognised by their `type` — the backend leaves `action_name` empty
for them and only fills it in for non-standard views.

| view (`type`) | `is_detail` | browser route (relative to the resource) |
| ------------- | ----------- | ----------------------------------------- |
| `list`        | `false`     | `/{resource}`                             |
| `create`      | `false`     | `/{resource}/create`                      |
| `edit`        | `true`      | `/{resource}/{id}`                        |
| `show`        | `true`      | `/{resource}/{id}/show`                   |

## Custom (non-reserved) views and actions

A view/action with an `action_name` is addressed through a dedicated `/a/` segment:

| target         | `is_detail` | browser route                             |
| -------------- | ----------- | ----------------------------------------- |
| list-level     | `false`     | `/{resource}/a/{action_name}`             |
| detail         | `true`      | `/{resource}/{id}/a/{action_name}`        |

Actions that point to another resource (`reference` set) or to a nested/linked resource keep the parent
context via additional `/r/…` (related) and `/n/{target}/…` (nested) segments, but the trailing view
segment always follows the table above.

## Presentation mode does not affect the URL

A view's `mode` / an action's `view.mode` (`redirect`, `dialog`, `sidepanel`) only changes **how** the target
view is presented — a full navigation, a dialog, or a sidepanel preview. It never changes the
route: the same view resolves to the same URL regardless of mode. When a trigger has no explicit mode,
the frontend inherits the target view's `mode` and falls back to `redirect`.
