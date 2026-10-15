---
title: Permissions
sidebar_position: 4
---

**Simple boolean form** — applies to all requests uniformly:

```ruby
can_create true   # default: false
can_read   true   # default: true
can_update true   # default: false
can_delete false  # default: false
```

Setting `can_read true` is a performance optimisation: by default the gem re-checks read permission on every record fetch; `true` skips that overhead and returns the same answer unconditionally.

**Block form** — evaluated per-request with a `Habarico::Context` argument (most common in production):

```ruby
can_create do |c|
  c.policy.create?
end
can_update do |c|
  c.policy.update?
end
can_delete do |c|
  c.policy.destroy?
end
```

**Custom non-standard permissions** — for actions that go beyond the four built-in permissions, declare a `can` block that receives the permission name and the context:

```ruby
can do |permission, c|
  case permission
  when :export then c.policy.export?
  when :approve then c.policy.approve?
  else false
  end
end
```

Custom permissions are checked via `context.can?(:export)` and can be referenced in `register_action` or action objects via `permission: :export`.

**Policy scope** — apply a Pundit policy scope to the index query before any filters:

```ruby
policy_scope ->(records, c) {
  Pundit.policy_scope(c.current_user, records)
}
```

The lambda receives the ActiveRecord relation and the current `Habarico::Context`. It is applied
in `show`, `update` and `destroy` too, in addition to `index` — a record outside the scope (a
different tenant, a soft-deleted row, ...) is never found by ID.

Without `can_read`, both `index` and `show` are forbidden — denying read really denies read, the
same as the Python backend.

**Read by ID** — `allow_read_by_id` explicitly re-opens ID-based access for a resource whose
`can_read` is denied:

```ruby
can_read         false
allow_read_by_id true   # default: false
```

With the flag set, a caller that holds a record ID may fetch that record even without read
permission — `show` works, and `index` accepts **only** an `id__in` filter (no other filters, no
fulltext search; without IDs the list is empty). Possession of the ID is treated as the
credential, while `policy_scope` still bounds what is reachable. This is what resolving a
[cross-service reference](../cross-service-references.md) into a display label needs — the
frontend's `ReferenceField` fetches referenced records via `id__in` — so a resource that other
services reference without having list access must set `allow_read_by_id true`. The resource
stays out of the menu and the global schema either way.

## See also

- [Permissions and visibility](/concepts/guides/permissions) — how these rules reach the screen
