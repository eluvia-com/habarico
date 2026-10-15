---
title: Pydantic Schemas
sidebar_position: 5
---

A Pydantic `BaseModel` (or `RootModel`) subclass may be used as the schema. The
registry extracts the JSON Schema via `model_json_schema()` and, if no `default` is
provided, derives one by instantiating the model with no arguments.

```python
from pydantic import BaseModel, Field
from habarico.contrib.preferences import register_preference

class TablePreference(BaseModel):
    page_size: int = Field(default=25, ge=1)
    dense: bool = False

# Default auto-derived: {"page_size": 25, "dense": False}
register_preference("product.table", schema=TablePreference)
```

If the model has required fields without defaults, you must pass an explicit `default`
(a dict or a model instance — instances are normalised via `model_dump(mode="json")`).
