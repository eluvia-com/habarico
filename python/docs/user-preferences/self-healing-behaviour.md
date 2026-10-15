---
title: Self-healing Behaviour
sidebar_position: 10
---

If a stored value no longer matches the current schema (e.g. you tightened the schema
after the value was stored), the registry deletes the offending record on the next
read and falls back to the default. There is no `migrate` callback — schema evolution
that needs to preserve data should be done in a Django data migration.

A read therefore never raises a validation error for stored values; either the value
is good and returned, or it's silently cleaned up and the default takes over (or
`None` if there is no default).
