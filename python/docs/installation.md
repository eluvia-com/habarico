---
title: Installation
sidebar_position: 2
---

```bash
pip install habarico
```

The package is published to the internal PyPI registry, not to pypi.org — configure the registry
credentials before installing.

Requires **Python 3.10+**. Django, Django REST Framework, `django-filter`,
`django-phonenumber-field`, `drf-extra-fields`, `jsonschema` and `pydantic` come in as
dependencies; nothing else has to be installed for the core feature set.

The [user preferences](./user-preferences/index.md) app is part of this package and is switched on
by adding `habarico.contrib.preferences` to `INSTALLED_APPS`.

## Enterprise extensions

The paid features live in a separate package, `habarico-enterprise`, which brings `habarico` in as
a dependency:

```bash
pip install habarico-enterprise                    # aggregations, dashboard, global search, CZ localflavor
pip install "habarico-enterprise[ai]"              # AI assistant and predictive fields
pip install "habarico-enterprise[reversion]"       # change history
pip install "habarico-enterprise[uploads-s3]"      # chunked upload to S3
pip install "habarico-enterprise[uploads-tus]"     # resumable chunked upload
```

| Extra | Enables | Also needs |
|---|---|---|
| *(none)* | [Aggregations](./aggregations/index.md), [dashboard](./dashboard.md), [global search](./filtering-and-searching/global-search.md), CZ [model fields](./basic-usage/custom-model-fields.md) | a per-admin opt-in flag |
| `ai` | [AI integration](./ai-integration/index.md) | `OPENAI_API_KEY` in the settings |
| `reversion` | [Change history](./change-history-reversion.md) | `reversion` in `INSTALLED_APPS` |
| `uploads-s3` / `uploads-tus` | [Chunked uploads](./chunked-uploads/index.md) | `habarico_enterprise.uploads` in `INSTALLED_APPS`, plus `HABARICO_UPLOADS` |

### Translations

Add `habarico_enterprise` to `INSTALLED_APPS` to get the paid features' messages in the twelve
shipped languages (cs, de, es, fr, it, ja, nl, pl, pt, ro, sk, uk), covering every module it
contains — aggregations, AI, change history, chunked uploads and the CZ validators:

```python
INSTALLED_APPS = [
    # …
    "habarico",
    "habarico_enterprise",
]
```

The app registers no models and switches no feature on — Django reads a translation catalog only
from a directory named in `INSTALLED_APPS`, and this is what points it at the package's `locale/`.
Leave it out and everything still works, in English.

:::caution
Before `habarico-enterprise` shipped its own catalog, these strings were translated in the free
`habarico` package. If you upgrade `habarico` without upgrading `habarico-enterprise` and adding
this entry, the paid features fall back to English.
:::

### No configuration is required

Apart from that entry, installing the package is the configuration. While resolving its settings, habarico imports
`habarico_enterprise.extensions` if it is importable and takes the classes listed there — the
composed `ModelAdmin`, `AdminModelViewSet`, `AdminSite` and `FieldSchemaGenerator` are wired in
without an `ADMIN_REST_FRAMEWORK` block. Your admin classes keep importing from `habarico`:

```python
from habarico import ModelAdmin  # resolves to the enterprise class once the package is installed
```

Each feature still has its own opt-in — installing the package does not switch anything on for a
resource that has not asked for it (`aggregate_enabled`, `dashboard_enabled`,
`global_fulltext_search_enabled`).

A project overrides any contributed key by setting it explicitly, which is how you swap in your own
subclass:

```python
ADMIN_REST_FRAMEWORK = {
    "DEFAULT_MODEL_ADMIN_CLASS": "myproject.admin.ModelAdmin",  # extends the enterprise one
}
```

To ignore the installed extensions altogether — a useful first step when debugging whether a
behavior comes from them — switch discovery off:

```python
ADMIN_REST_FRAMEWORK = {"EXTENSION_DISCOVERY_ENABLED": False}
```

:::note
Discovery only needs the package to be **importable**, so it works with a regular install, an
editable install (`pip install -e .`) and a linked source tree alike. A broken import inside the
extension is never swallowed — it surfaces instead of silently disabling the paid features.
:::

## See also

- [Configuration](./configuration.md) — the settings that have to follow
- [Basic usage](./basic-usage/index.md) — the first admin class
