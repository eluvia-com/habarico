---
title: globMatch
sidebar_position: 6
---

Small utility used by `createBackendStore`'s whitelist. Supports two wildcards:

- `*` — matches a single segment (no `.`)
- `**` — matches across segments (greedy)

```typescript
import {matchesAnyGlob} from '@eluvia/habarico';

matchesAnyGlob('preferences.users.columns', ['preferences.*.columns']);     // → true
matchesAnyGlob('preferences.users.foo.columns', ['preferences.*.columns']); // → false (single * is one segment)
matchesAnyGlob('preferences.users.foo.columns', ['preferences.**']);        // → true
```

## See also

- [createBackendStore](./create-backend-store-backend-synced-preferences.md) — the whitelist these globs are matched against
