---
title: Configuration
sidebar_position: 3
---

Three things have to be set: the apps, the admin API's permissions, and the URLs.

## Installed apps

```python
INSTALLED_APPS = [
    ...,
    "phonenumber_field",   # only if you use phone number fields
    "habarico",
    "rest_framework",
    ...
]
```

:::caution
`habarico` must come **before** `rest_framework`. It overrides DRF's translation catalogue, and
Django resolves translations in app order — the wrong order leaves DRF's own messages in place,
which shows up as untranslated validation errors in the admin.
:::

## Permissions and authentication

The admin API has its own DRF settings block, so it can be locked down independently of the public
API:

```python
ADMIN_REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "your_permissions.IsAdminUser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "eluvia.auth.django.authentications.PublicJwtAuthentication",
    ],
}
```

Keys not listed here fall back to `REST_FRAMEWORK`, so a project whose admin uses the same
authentication as the rest of the API can leave the block out entirely.

Without any configuration, `DEFAULT_PERMISSION_CLASSES` defaults to
`rest_framework.permissions.IsAuthenticated` — the admin API rejects anonymous requests out of the
box. That default is a safety net, not a recommendation: set a permission class matching your
project's roles, as in the example above.

:::caution
Versions before 5.11 defaulted to `AllowAny`, leaving an unconfigured admin API open to anonymous
requests. A project that relied on the open default must now configure
`DEFAULT_PERMISSION_CLASSES` explicitly.
:::

### The `habarico.W001` system check

`manage.py check` (and every server start) warns with `habarico.W001` when the effective
`DEFAULT_PERMISSION_CLASSES` of the admin API contains `AllowAny` or is empty — both hand anonymous
CRUD over every registered resource to the world. If anonymous access is intended, silence the
check explicitly:

```python
SILENCED_SYSTEM_CHECKS = ["habarico.W001"]
```

## Pagination

The page size of the admin list endpoints is configured in the same block:

```python
ADMIN_REST_FRAMEWORK = {
    "DEFAULT_PAGE_LIMIT": 50,   # page size when the request sends no `limit`
    "MAX_PAGE_LIMIT": 200,      # largest `limit` a request may ask for; above it answers 422
}
```

Both are optional — without them a page holds 20 objects and `limit` is capped at 1000 — and both
are overridable per resource. See [Pagination](./basic-usage/pagination.md).

## URLs

```python
# urls.py
from django.urls import include, path
from habarico import site

urlpatterns = [
    path("admin/", include(site.urls)),
]
```

The prefix you choose here is the service URL the frontend is configured with — see
[SchemaAdmin](/node/base-components/schema-admin#service-config-map).

`site.urls` returns the routes together with the URL namespace `habarico`, so a route reverses as
`habarico:<name>`. Mounting the optional apps adds their routes to the same namespace: installing
`habarico.contrib.preferences` appends the [user preferences](./user-preferences/index.md)
endpoints, and with `habarico-enterprise` installed its `AdminSite` contributes the
[global search](./filtering-and-searching/global-search.md) and, once
`habarico_enterprise.uploads` is in `INSTALLED_APPS`, the [chunked upload](./chunked-uploads/index.md)
routes — no separate `include()` and no settings block are needed, see
[Installation](./installation.md#enterprise-extensions).

:::caution
The namespace was renamed from `eluvia-admin` to `habarico`. A project that reverses admin URLs by
name has to follow.
:::

## Optional settings

| Setting | Default | What it does |
|---|---|---|
| `ADMIN_MENU_GENERATOR_DEFAULT_PRIORITY` | `5` | Priority a [menu group](./menu-customisation.md) gets when it declares none |
| `ADMIN_SEARCH_UNACCENT_ENABLED` | `False` | Makes [fulltext search](./filtering-and-searching/fulltext-search.md) diacritics-insensitive; needs the PostgreSQL `unaccent` extension |

## See also

- [Basic usage](./basic-usage/index.md) — the first admin class
- [Permissions](./basic-usage/permissions.md) — per-resource and per-record rules
- [REST API reference](/api) — the endpoints this mounts
