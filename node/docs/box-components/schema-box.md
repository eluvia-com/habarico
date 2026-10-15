---
title: SchemaBox
sidebar_position: 2
---

Renders one node of a view's box tree by asking the box provider which container to use.

Every box in a view goes through it, including nested ones — the containers render their children
by calling `SchemaBox` again. Mount it directly when you build a view of your own and want a box
declared in the schema to render exactly as it would in a generated view.

## Example

```tsx
const {getViewSchema} = useGetLocalResourceSchema({resource: 'eshop/product'});
const box = getViewSchema('edit')?.detail?.box;

{box && <SchemaBox schema={box} excludeFields={['created_at']} />}
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `schema` (required) | `BoxSchema` | — | The box to render |
| `label` | `string \| ReactElement \| false` | — | Heading passed to the container; rendered through `DynamicText`, so `%{record.name}` resolves against the current record or form and rich text tokens are parsed |
| `excludeFields` | `string[]` | — | Field names to skip — used when a field is already rendered somewhere else in the view |

## How the container is chosen

`SchemaBox` calls the box provider chain with `{resource, schema, excludeFields, props}` and renders
whatever comes back. `defaultBoxProvider` maps `schema.type` to the built-in containers:

| `schema.type` | Container |
|---|---|
| `list` | [SchemaListBox](./list-box.md) |
| `gallery` | [SchemaGalleryBox](./gallery-box.md) |
| `object` | [SchemaObjectBox](./object-box.md) |
| `array` | [SchemaArrayBox](./array-box.md) — or `SchemaChoicesArrayBox` when `array.listed` is set |
| `grid` | [SchemaGridBox](./grid-box.md) |
| `tab` | [SchemaTabBox](./tab-box.md) |
| `wizard` | [SchemaWizardBox](./wizard-box.md) |
| anything else | [SchemaSimpleBox](./simple-box.md) |

The `simple` branch is a `default` case rather than an explicit match, so a box type the frontend
does not know still renders its fields instead of disappearing.

When the provider returns nothing, `SchemaBox` renders `null` — that is how an override opts out of
a box entirely.

## Conditional rendering

`SchemaBox` evaluates `schema.options.dynamicRender`:

- `showQuery` — a condition expression; the box disappears when it evaluates falsy. A box in a
  grid takes its grid cell with it, and a box that is a tab or a wizard step takes its tab or step.
- `requiredQuery` — makes the box required while it evaluates truthy. Of the built-in boxes only
  the object box acts on it: its fields always show and it offers no remove button. A custom box
  from a [BoxProvider](../providers/box-provider.md) receives it as the `isRequired` prop.

Both are condition expressions with a fixed grammar, parsed and interpreted by the frontend — they
are never executed as JavaScript, so a schema cannot run code in the admin session and the app
works under a CSP without `unsafe-eval`. An expression may contain:

- identifiers with dot paths (`status`, `record.author.role`), resolved against the current form
  data or record — an unknown path is `undefined`
- literals: strings in `'…'` or `"…"` (any characters, accented included), numbers, `true`,
  `false`, `null`, `undefined`
- comparisons `==` `!=` `===` `!==` `<` `<=` `>` `>=`, logical `&&` `||` `!`, and parentheses,
  all with JavaScript semantics and precedence

Anything else — function calls, arithmetic, assignments, indexing — is rejected with an
`Invalid expression.` error when the schema renders. Both queries are declared on the backend:

```python
Box(
    label="Publishing",
    boxes=["published_at", "channel"],
    show_query="status === 'published'",
    required_query="status === 'published'",
)
```

:::caution
A hidden box still keeps its fields in the form state — hiding is not the same as removing. If a
field must not reach the backend at all, leave it out of the view on the backend instead of hiding
it with `show_query`.
:::

## See also

- [Box provider](../providers/box-provider.md) — replacing a container with your own
- [Box components](./index.md) — every container this dispatches to
- [ViewSchema](../types-and-schemas/view-schema-and-action-schema.md) — where the box tree comes from
