---
title: Context Object
sidebar_position: 3
---

Habarico can be usually configured with:
- static values (`can_read true`) or
- dynamic blocks that receive a `Habarico::Context` object (`can_update do |c| c.policy.update? end`) or
- lambdas that also receive a `Habarico::Context` object.

The `Habarico::Context` object exposes:

| Property | Description |
|----------|-------------|
| `current_user` | Authenticated user from the request |
| `record` | The ActiveRecord record (lazy-loaded, may be `nil`) |
| `record_pk` | The record's primary key |
| `definition` | The resource's `Habarico::Definition` |
| `policy` | Pundit policy object (if Pundit is configured) |
| `target` | The target context (e.g. ID of the parent record), used in embedded views |
| `source` | From which source the action/schema is requested (e.g. `{ "prototype/employees" => 7 }`); lets context-aware schemas resolve the originating resource/record |
