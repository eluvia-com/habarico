---
title: Habarico for Ruby
sidebar_position: 1
---

`habarico` is a Ruby on Rails engine. It turns Rails models into a schema-driven admin API: REST
endpoints plus JSON schemas describing resources, fields, views and actions, consumed by the
Habarico React frontend. You write models and a thin controller layer; the gem generates the rest.

The engine is designed for CMS and ERP style back-office applications, where most screens are
variations on the same list / detail / form pattern and hand-writing them is wasted effort.

## Where to start

| Page | What it covers |
| --- | --- |
| [Installation](./installation.md) | Adding the gem to a Rails application |
| [Configuration](./configuration.md) | The initializer and its options |
| [Authentication](./authentication.md) | The `authenticate_request` hook every endpoint runs |
| [Basic usage](./basic-usage/index.md) | Controllers, permissions, data loading, fields and views |
| [Schema & field customization](./schema-and-field-customization/index.md) | Shaping the list, detail and form views |
| [User preferences](./user-preferences.md) | The per-user preference store the frontend syncs to |
| [Complete example](./complete-example.md) | One resource wired up end to end |

The schemas this library produces follow the same [contract](/api) as the Python library, so the
same [React frontend](/node/intro) renders either backend without changes.
