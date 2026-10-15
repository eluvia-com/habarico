---
title: Cross-Service References
sidebar_position: 12
---

`Habarico::ActiveModel::References` is a mixin for non-ActiveRecord models that need to declare references to records managed by another service. Include it in your model class to get a DSL for registering cross-service associations.

```ruby
class OrderDocument
  include Habarico::ActiveModel::References

  has_one_reference  :order,   'Order'
  has_many_reference :signers, 'Contact'
end
```

**Class methods** provided by the mixin:

| Method | Description |
|--------|-------------|
| `has_one_reference(name, class_name)` | Declare a has-one cross-service reference. Creates an underlying string attribute to hold the remote ID. |
| `has_many_reference(name, class_name)` | Declare a has-many cross-service reference. Creates an array-of-strings attribute for IDs and a companion `__items` reference for metadata. |
| `references(type: nil)` | Return all declared references, optionally filtered by `:has_one` or `:has_many`. |
| `reference_names(type: nil)` | Return an array of reference name symbols. |
| `has_reference?(name, type: nil)` | Check whether a reference with the given name exists. |
| `find_reference(name, type: nil)` | Return the reference definition hash for the named reference. |

This module extends `Eluvia::ActiveModel::Attributes` and `Eluvia::ActiveModel::ArrayAttribute` for attribute storage.

## Permissions on the referenced resource

The frontend resolves a reference into a display label by fetching the referenced records with an
`id__in` filter on the target resource's list endpoint. When the target resource denies
`can_read`, that fetch is forbidden too — set `allow_read_by_id true` on the target resource to
allow ID-based reads without list access. See
[Permissions](./basic-usage/permissions.md) for the exact semantics.
