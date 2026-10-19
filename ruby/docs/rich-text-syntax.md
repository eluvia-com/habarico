---
title: Rich Text Syntax
sidebar_position: 8
---

Labels, titles, and other string values can contain special tokens that the frontend (`habarico`)
interprets as icons, highlighted text, or bold text. The backend sends a plain string — no schema
changes are required; the FE parses and renders the tokens at runtime.

## Supported tokens

| Token | Description |
|---|---|
| `[icon:IconName]` | Inline icon from the MUI icon set |
| `[icon:IconName:#rrggbb]` | Icon with custom hex colour |
| `[highlight]text[/highlight]` | Highlighted text (colour adapts to light/dark mode) |
| `[bold]text[/bold]` | Bold text |

`IconName` must match a valid MUI Material icon name (e.g. `CheckCircle`, `Warning`, `Star`).
Icon colour must be a 3- or 6-digit hex value (`#f00`, `#ff0000`). Invalid colours are silently ignored.

## Examples

```ruby
# In a FieldReference label
Habarico::FieldReference.new(name: :status, label: '[icon:CheckCircle:#2e7d32] Status')

# In a list view column
fields [
  Habarico::FieldReference.new(name: :name, label: '[icon:Inventory] Product'),
  :price,
  :status,
]
```

## Edge cases

- Unknown tags (e.g. `[foo]text[/foo]`) are passed through as plain text.
- A tag without a matching closing tag is also passed through as plain text.
- Frontend template placeholders (`%{...}`) and rich text tokens can coexist in the same string.
