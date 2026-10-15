---
title: Habarico for Python
sidebar_position: 1
---

`habarico` is a Django REST Framework library. It turns Django models into a schema-driven admin
API: REST endpoints plus JSON schemas describing resources, fields, views and actions, consumed by
the Habarico React frontend. You write models and a thin `ModelAdmin` layer; the library generates
the rest.

It is designed for CMS and ERP style back-office applications, where most screens are variations on
the same list / detail / form pattern and hand-writing them is wasted effort.

## Where to start

| Page | What it covers |
| --- | --- |
| [Installation](./installation.md) | Adding the package to a Django project |
| [Configuration](./configuration.md) | Settings, URLs and the admin site |
| [Basic usage](./basic-usage/index.md) | Model admins, permissions, fields and serializers |
| [View generators](./view-generators/index.md) | Shaping the list, form and action views |
| [Complete example](./complete-example.md) | One resource wired up end to end |

The schemas this library produces follow the same [contract](/api) as the Ruby library, so the same
[React frontend](/node/intro) renders either backend without changes.
