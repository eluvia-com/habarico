---
title: Context hooks
sidebar_position: 13
---

What a component rendered by the schema can read about its surroundings — which admin it is in,
which view, which field, and which record the whole screen belongs to.

These are the hooks a custom field, input or box reaches for. Inside the generated views the
contexts are already in place; outside them the ones that throw will say so.

| Hook | Gives you | Outside its provider |
|---|---|---|
| `useSchemaRootContext` | The resolved providers, service schemas and identity | Throws |
| `useAdminConfig` | The app-shell configuration | Throws |
| `useIcons` | `iconsMap` and the `getIcon` resolver | Returns an empty map |
| `useViewSchemaContext` | The view being rendered, plus `readOnly` | Throws |
| `useFieldSchemaContext` | The schema of the field being rendered | Throws |
| `useRootRecordContext` | The record the screen belongs to | Returns `undefined` |
| `useFormInputSourcesContext` | The sources registered on the current form | Returns empty defaults |
| `useFormInputSourcesRegistration` | `register` / `unregister` alone, without the list | Returns `undefined` callbacks |
| `useUnsavedChanges` | Whether the form has unsaved changes | Returns `false` |
| `useUnsavedChangesControl` | Read or set that flag without subscribing | Returns a no-op pair |

:::caution
The single `useAdminContext` of earlier versions no longer exists. The schema-driven half of it is
`useSchemaRootContext`, the app-shell half is `useAdminConfig`, and the icon resolver moved to
`useIcons`.
:::

## useSchemaRootContext

The schema-driven root of the admin, resolved: every provider together with its default
(`fieldProvider` / `defaultFieldProvider`, and the same pair for inputs, boxes, buttons and
views), the `schemaProvider`, the built `dataProvider` and `authProvider`, the fetched
`servicesSchema` with `refetchSchema`, the `serviceConfigMap`, the declared `resources`, and the
flags `defaultRowAction`, `rowTooltip`, `hasDashboard`, `isLoaded`.

```typescript
const {servicesSchema, isLoaded, defaultRowAction, userIdentity} = useSchemaRootContext();
```

`userIdentity` is held above React Admin's own `<Admin>` and kept current through
`setUserIdentity` across sign-ins, sign-outs and impersonations — it is the identity the schema
fetches and the per-user store are keyed by.

An admin assembled by hand supplies both itself — see
[SchemaRootContextProvider](../base-components/schema-root-context-provider.md).

## useAdminConfig

Everything the app shell was configured with: `logo`, `menu`, `availableLanguages`, `search`,
`marketing`, `status`, `breadcrumbs`, `arrangement`, `contentMaxWidth`, `columnSelector`,
`onLogout`, `updateIdentity`, `changePassword`, `navigationGuard`, `draftEnabled`,
`defaultPerPage`, `notificationAutoHideDuration` and `iconsMap`.

It is shared by both entry points — [SchemaAdmin](../base-components/schema-admin.md) and the
schema-agnostic `BaseAdmin` — which is why the layout components can read it without taking props.

:::tip
The current locale is **not** here. It lives in the React Admin store; read it with
`useLocaleState()` from `react-admin`.
:::

## useIcons

```typescript
const {iconsMap, getIcon} = useIcons();

const icon = getIcon('status', 'published', 'orderStatus');
```

`getIcon(source, value, iconsKey)` resolves a value against the `iconsMap` — the entry may be a map
of value to element or a function of `(source, value)`. It returns `undefined` when `iconsKey` is
missing from the map, which is how [ChoicesField](../field-components/choices-field.mdx) falls back
to a plain chip.

## useViewSchemaContext

The view currently rendering:

| Name | Type | Description |
|---|---|---|
| `viewSchema` | `ViewSchema` | The view's own schema |
| `methodSchema` | `MethodSchema` | The endpoint schema its fields come from |
| `resource` | `string` | Resource in `"service/resource"` form |
| `recordId` | `Identifier` | Present on detail views |
| `actionName` | `string` | Present when the view belongs to an action |
| `readOnly` | `boolean` | Derived — see below |

`readOnly` is the flag the boxes use to decide between displaying and editing — read it instead of
comparing `viewSchema.type` yourself. It is `true` for `list` and `show` views, and also for an
`action` view whose root box is read-only (a routed action that only presents data, with no form to
submit).

## useFieldSchemaContext

The `FieldSchema` of the field being rendered — its type, format, label, validation and options.
This is what a custom field or input reads instead of taking everything through props.

## useRootRecordContext

The record the whole screen is about, as opposed to the record of the row or array item currently in
scope. Inside a list box or an array box, react-admin's `useRecordContext` gives you the inner
record; this one still gives you the outer one.

```typescript
const order = useRootRecordContext<Order>();
```

It returns `undefined` outside a detail view rather than throwing, so a component that works in both
places does not need a guard.

## useFormInputSourcesContext

The list of input sources registered on the current form. Array boxes register their target so the
form knows the field exists even before an item is added.

```typescript
const {sources} = useFormInputSourcesContext();
```

It re-renders the caller on every registration, because that is when the list changes. Use it only
where you need the list itself; to register an input, use `useFormInputSourcesRegistration` below.

The hook also returns `register` / `unregister`, so an existing call site keeps working — but
reaching for them here subscribes you to the list for nothing.

## useFormInputSourcesRegistration

`register` / `unregister` on their own, for an input that only adds itself to the form's source
list. Its value never changes, so subscribing costs nothing and a registration re-renders no one.

```typescript
const {register, unregister} = useFormInputSourcesRegistration();
```

Both are `undefined` outside a form — check before calling, as the built-in boxes do.

## useUnsavedChanges

Whether the form currently has unsaved changes. Re-renders the caller whenever that flips, so use it
only where you render something off the value — a badge, a disabled state.

```typescript
const {hasUnsavedChanges} = useUnsavedChanges();
```

## useUnsavedChangesControl

The same flag, read and written without subscribing — the value of this context never changes.

```typescript
const {getHasUnsavedChanges, setHasUnsavedChanges} = useUnsavedChangesControl();
```

`getHasUnsavedChanges()` returns the value current at call time, so call it from an event handler or
an effect, never during render. This is what a button that guards navigation should use: it needs
the flag when it is clicked, not on every keystroke that changes it.

## useGetTargetValues

The foreign keys a record being created should inherit from where the user came from — creating an
order from a customer's detail gives `{customer: 42}`.

```typescript
const targetValues = useGetTargetValues();
// → {customer: 42} | undefined
```

It is resolved from two sources, in order:

1. the `_target` query parameter of the current view, parsed as JSON — malformed JSON yields
   `undefined` rather than throwing,
2. otherwise the **last** parent resource descriptor that carries a `target`, which is what a
   [list box](../box-components/list-box.md) pushes when it renders a related list.

Use it to pre-fill a hand-built create form the same way the generated one does.

## See also

- [Providers](../providers/index.md) — where custom components are registered
- [Custom field type](/concepts/guides/custom-field-type) — a field built with these hooks
- [Types and schemas](../types-and-schemas/index.md) — the shapes they return
