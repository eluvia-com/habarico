---
title: List View
sidebar_position: 2
---

Configure the list view with field, filter, and action declarations:

```ruby
Habarico::ListView.new(
  boxes: [
    Habarico::FieldReference.new(
      name: :product,
      label: 'Unit',
      sortable: true,
      sort_by: 'products.name',
    ),
    :customer,
    :status,
    Habarico::FieldReference.new(name: :outstanding_amount, label: 'Debt', text_align: 'right'),
    :placed_at,
    :delivered_at,
  ],
  filters: [],                                          # drawer filters (empty — all in toolbar)
  toolbar_filters: [:status, :category, :product],  # always-visible toolbar filters
  row_actions: [:show, :edit, :delete],
  toolbar_actions: [:create],
  default_sorting: 'placed_at:desc',
)
```

`Habarico::FieldReference` options:

| Option | Description |
|--------|-------------|
| `name` | Field name (symbol) |
| `label` | Display label |
| `short_label` | Compact label for narrow columns |
| `help_text` | Tooltip text |
| `sortable` | Whether this column is sortable |
| `sort_by` | Override the DB column used for sorting |
| `read_only` | Mark as read-only |
| `write_only` | Mark as write-only |
| `default_value` | Default value for the field |
| `show_query` | Condition expression to conditionally show the field |
| `required_query` | Condition expression to conditionally require the field |
| `text_align` | Text alignment (`'left'`, `'right'`, `'center'`) |
| `target` | Target resource name for nested/related fields |
| `action` | Action object attached to the field (makes the field clickable) |
| `wrapper` | Wrapper type for the field display |
| `phone` | Phone number formatting options |
| `icons_key` | Key used to map enum values to icons |
| `resize_width` | Target width for image resizing (image fields) |
| `crop_aspect_ratio` | Aspect ratio constraint for image cropping (image fields) |
| `parent` | Parent field name for nested field hierarchies |
| `ai_source_fields` | Array of field names used as AI generation source |
| `relation` | Override relation metadata for relation fields (hash, see below) |

`relation` hash options (relation fields only):

| Option | Description |
|--------|-------------|
| `show_link` | Show a link to the related resource detail |
| `link_mode` | How to open the linked resource detail (`'redirect'` or `'dialog'`) |
| `dialog_width` | Width of the dialog when `link_mode` is `'dialog'` (MUI breakpoint like `'sm'`/`'md'` or a CSS width value like `'800px'`) |
| `keep_linked_parent` | Keep the linked parent in the URL when navigating to the linked resource |
| `show_edit_button` | Show edit button for inline editing of the related resource |
| `show_create_button` | Show create button for inline creation of a new related resource |
| `preserve_order` | Preserve the order of the values according to the order in the source field |
| `filters` | Static key-value filters applied to the relation resource query |
| `sort` | Default sorting applied to the relation resource query (hash `{ field_name:, direction: }` or string like `'name:asc'`) |
| `parent` | Name of the parent field this field depends on (used for tree/hierarchical relations) |

```ruby
Habarico::FieldReference.new(
  name: :author,
  relation: { link_mode: 'dialog', dialog_width: 'sm' },
)
```

`Habarico::FilterReference` options:

| Option | Description |
|--------|-------------|
| `name` | Filter name (symbol) |
| `label` | Display label |
| `help_text` | Tooltip text |
| `is_always_on` | Keep filter visible even when inactive (renders in the toolbar) |
| `default_value` | Pre-filled default value |
