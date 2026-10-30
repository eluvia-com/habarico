---
title: Box Types Reference
sidebar_position: 8
---

All available box types and their attributes:

| Class | Type string | Description |
|-------|-------------|-------------|
| `Habarico::Box` | `'simple'` | Basic labeled container for fields |
| `Habarico::GridBox` | `'grid'` | 12-column responsive grid container |
| `Habarico::TabBox` | `'tab'` | Tabbed container; children must be `TabItemBox` |
| `Habarico::WizardBox` | `'wizard'` | Step-by-step container; children must be `TabItemBox` (each is a step) |
| `Habarico::TabItemBox` | `'tab-item'` | Individual tab / wizard step pane |
| `Habarico::ListBox` | `'list'` | Embedded list of related records |
| `Habarico::ArrayBox` | `'array'` | Inline editor for array / has-many data |
| `Habarico::ObjectBox` | `'object'` | Inline display of a nested object |
| `Habarico::GalleryBox` | `'gallery'` | Image gallery from a related resource |

**Common attributes** (on all box types via the base `Box` class):

| Attribute | Description |
|-----------|-------------|
| `label` | Section heading text |
| `name` | Box name (used for `ListBox` referencing) |
| `boxes` | Child boxes or field symbols |
| `read_only` | Mark all fields in this box as read-only |
| `card` | Render the box as a card component. Three states: `true` always, `false` never (even with a label, whose text then becomes a plain section heading), and omitted - the frontend decides from the label, the toolbar actions, the collapsible flag and the surface (the view's first box takes the card on a page, not in a dialog or side panel; a first box that only wraps other boxes - `GridBox`, `TabBox`, `WizardBox`, a `Box` without fields - hands that default to its children, so the card lands on the first box holding fields) |
| `collapsible` | Make the box collapsible; `'open'` (expanded) or `'closed'` (collapsed) sets the default state. Omit for a non-collapsible box |
| `show_query` | Condition expression to conditionally show the entire box |
| `required_query` | Condition expression to conditionally require the box |
| `toolbar_actions` | Actions rendered in the box's local toolbar (box header / card header area), relative to the box root. On a tab/wizard container they appear on the last step. On a `ListBox` this is the box-level toolbar; use `list_toolbar_actions` for the table's own toolbar |
| `bottom_actions` | Actions rendered at the bottom of the box, below the fields - similar to form submit buttons at the view level |
| `grid_item` | Placement of the box inside its parent `GridBox`: a hash of MUI grid column widths per breakpoint, `{ xs:, sm:, md:, lg:, xl: }` (integer 1–12). An omitted breakpoint inherits the one below it, so `{ md: 9 }` is a complete placement; omit the attribute entirely to let the frontend compute the spans from the number of cells |

Because `grid_item` is a placement rather than a box type, a grid cell can be a `ListBox`,
`GalleryBox` or `ArrayBox` itself, and its card stretches to the height of the row.

**`TabBox`-specific**: `show_toolbar_navigation` (show previous/next buttons in the box toolbar; default `false`)

**`WizardBox`-specific**: `show_toolbar_navigation` (show previous/next buttons; default `true`), `validate_steps` (validate the current step before moving to the next one; default `true`)

**`ListBox`-specific** (all attributes):

| Attribute | Description |
|-----------|-------------|
| `reference` | Resource name of the embedded list |
| `target` | Foreign key name linking the list to the parent |
| `extra_filters` | Lambda `(c) -> Hash` for additional filters |
| `row_actions` | Actions available per row |
| `toolbar_actions` | Box-level actions rendered at the box root (box / card header), like on any other box |
| `list_toolbar_actions` | Actions in the table's own toolbar (top of the resource list, e.g. create); emitted as `toolbar_actions` inside the `list` params |
| `list_actions` | Utility actions (export, print, …) rendered next to the filter bar, separate from row and toolbar actions |
| `filters` | Filter references for the embedded list |
| `default_sorting` | Default sort expression |
| `sortable_field_name` | Field name used for drag-and-drop row sorting |
| `sortable_sort_for_filters` | Filter applied when saving sorted order |
| `single_click_action` | Action triggered by a single click on a row |
| `double_click_action` | Action triggered by a double click on a row |
| `schema_params` | Extra query params sent when the box fetches the referenced resource's schema |

**`GalleryBox`-specific**: `reference`, `target`, `image_field`, `extra_filters`, `schema_params` (use the common `toolbar_actions` attribute above to add manage/upload buttons)

**`ArrayBox`-specific**: `target` (attribute name on the parent holding the array), `inline` (render items inline like table rows; defaults to `true` unless the box contains nested boxes)

**`ObjectBox`-specific**: `target` (attribute name on the parent holding the nested object)
