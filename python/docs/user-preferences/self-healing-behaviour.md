---
title: Self-healing Behaviour
sidebar_position: 10
---

If a stored value no longer matches the current schema — the schema was tightened, or the shape it
describes changed — the registry repairs the record on the next read, and deletes it when it cannot.

A read therefore never raises a validation error for a stored value: either the value is good and
returned, or it is migrated, or it is deleted and the default takes over (`None` when the key has no
default). A record whose key is no longer registered at all is deleted the same way.

## Migrating a value instead of losing it

A Pydantic schema may offer a `migrate_value` classmethod. The registry calls it with the stored
value before deleting anything, validates what comes back and saves it — so a shape change needs no
data migration, and the repair happens once per record, on the first read after the deploy:

```python
from typing import Any, Optional

from pydantic import BaseModel


class TablePreference(BaseModel):
    columns: list[str] = []

    @classmethod
    def migrate_value(cls, value: Any) -> Optional[dict]:
        """Bring a value that stored a single column name as a string up to the list shape."""
        if isinstance(value, dict) and isinstance(value.get("columns"), str):
            return {**value, "columns": [value["columns"]]}
        return None
```

Four things to know about it:

- **Pydantic schemas only.** A key registered with a raw JSON Schema dict has nowhere to hang the
  method, so its invalid values are deleted as before.
- **Return something that does not validate to decline.** `None` is the readable way to say "nothing
  here for me to fix"; the record is then deleted exactly as it would have been.
- **A migration that raises declines too.** A schema's own bug must not make reading preferences
  fail, so the exception is swallowed and the record deleted.
- **The old shape has to be invalid for it to run.** A value the current schema still accepts is
  returned untouched, so a schema that keeps accepting the old shape never sees its migration called.
  Pydantic ignores unknown keys, which is why a renamed key usually needs the schema to refuse the
  old name — `model_config = ConfigDict(json_schema_extra={"not": {"required": ["old_name"]}})`
  refuses exactly that one, where `extra="forbid"` would throw away a value over any stray field.

## What is never healed

Lowering a size limit deletes nothing: stored values are not re-checked against `max_bytes` on read.
See [Size limits](./size-limits.md).
