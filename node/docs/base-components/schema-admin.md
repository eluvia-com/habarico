---
title: SchemaAdmin
sidebar_position: 2
---

Mounts the whole admin: providers, routing, theme, layout and the service schemas everything else
is generated from.

There is exactly one of these per application. Everything below it —
[resources](./schema-resource.md), views, fields — is driven by the schemas it loads.

## Example

```tsx
import {SchemaAdmin, SchemaResource} from '@eluvia/habarico';

const SERVICES = {
  eshop: {
    url: 'https://api.example.com/api/v1/eshop/admin',
    label: 'E-shop',
    syncPreferences: true,
  },
} as const;

const App = () => (
  <SchemaAdmin
    authProvider={authProvider}
    serviceConfigMap={SERVICES}
    columnSelector
    navigationGuard
  >
    <SchemaResource name="eshop/product" />
    <SchemaResource name="eshop/order" />
  </SchemaAdmin>
);
```

## Props

### Required

| Name | Type | Description |
|---|---|---|
| `authProvider` | `ServiceAuthProvider` | Authentication and identity — see [AuthProvider](../providers/auth-provider.md) |
| `serviceConfigMap` | `Readonly<ServiceConfigMap>` | The backends this admin talks to — see below |

### Providers and preferences

| Name | Type | Default | Description |
|---|---|---|---|
| `dataProviderFactory` | `(servicesSchema, getAuthHeaders) => ServiceDataProvider` | `getDataProviderFactory` | Builds the data provider once the schemas are known — called as `dataProviderFactory(servicesSchema, authProvider.getAuthHeaders)`, so pass the function itself rather than pre-binding it. The default speaks the Habarico REST contract; supply your own only for a backend that does not. See [DataProvider](../providers/data-provider.md) |
| `schemaProviderFactory` | `(getAuthHeaders) => SchemaProvider` | `getSchemaProvider` | Builds the schema provider — called as `schemaProviderFactory(authProvider.getAuthHeaders)`, so pass the function itself rather than pre-binding it. A package extending the library supplies its own; `habarico-enterprise` returns the built-in provider plus the aggregate schema endpoint. See [SchemaProvider](../providers/schema-provider.md) |
| `preferencesWhitelist` | `string[]` | `PREFERENCES_WHITELIST` | Store keys mirrored to the backend `user-preferences` endpoint. Spread the exported default to add keys of your own rather than restating the list |

### Overriding generated UI

| Name | Type | Default | Description |
|---|---|---|---|
| `fieldProvider` | `AdminFieldProvider` | `defaultFieldProvider` | [Custom display components](../providers/field-provider.md) |
| `inputProvider` | `AdminInputProvider` | `defaultInputProvider` | [Custom form inputs](../providers/input-provider.md) |
| `buttonProvider` | `AdminButtonProvider` | `defaultButtonProvider` | [Custom action buttons](../providers/button-provider.md) |
| `boxProvider` | `AdminBoxProvider` | `defaultBoxProvider` | [Custom layout containers](../providers/box-provider.md) |
| `validatorProvider` | `AdminValidatorProvider` | `defaultValidatorProvider` | [Custom validators for the schema's validation rules](../providers/validator-provider.md) — admin-wide only |

### Layout and appearance

| Name | Type | Default | Description |
|---|---|---|---|
| `LayoutComponent` | `LayoutComponentType` | `SchemaLayout` | Replaces the whole layout shell |
| `LogoComponent` | `LogoComponentType` | — | Logo in the menu header |
| `marketingFooter` | `MarketingSlot` | — | Marketing block at the bottom of the sidebar — `{logo?, label?, href?}` |
| `statusFooter` | `StatusSlot` | — | Version / environment strip at the bottom of the sidebar — `{version?, environment?, labels?}` |
| `arrangement` | `ArrangementSlot` | — | Enables the page-width control in the settings panel; `true` for the defaults, or `{labels?, tooltip?, header?}` |
| `lightTheme` / `darkTheme` | `object` | built-in themes | MUI themes |
| `contentMaxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| false` | `'xl'` | Max width of the content area; `false` removes the cap |
| `iconsMap` | `IconsMap` | — | Named icons referenced from the schema, e.g. by `options.choices.iconsKey` |
| `extraMenuItems` | `ExtraMenuItem[]` | `[]` | Extra or reordered menu entries — see below |
| `availableLanguages` | `AdminLanguage[]` | `[]` | Languages offered in the UI; the initial locale is the closest match to the browser's, otherwise `cs-CZ` |

### Pages

| Name | Type | Default | Description |
|---|---|---|---|
| `dashboard` | `DashboardComponentType` | — | Component on `/`. No default: the dashboard ships in `habarico-enterprise`. Left unset, the admin has no root page and every resource is still reachable from the menu |
| `search` | `SearchComponentType` | — | Renders the global search overlay's contents. Left unset the shell offers no search at all — not even the toggle or <kbd>Cmd</kbd>+<kbd>K</kbd> — because the results come from an endpoint only a paid backend serves. `habarico-enterprise` exports `SchemaSearch` for it, and `EnterpriseSchemaAdmin` passes it for you |
| `authPage` | `LoginComponentType` | `<AuthPage />` | [Login page](../page-components/auth-page-component.md) |
| `resetPasswordPage` | `ReactElement` | `<ResetPasswordPage />` | [Reset password page](../page-components/reset-password-page-component.md) |
| `UpdateIdentityComponent` | `FC \| false` | `UpdateIdentityDialog` | The whole profile dialog; `false` removes the account-menu item |
| `ChangePasswordComponent` | `FC \| false` | `ChangePasswordDialog` | The whole change-password dialog; `false` removes the account-menu item |
| `basename` | `string` | — | Path prefix when the admin is not mounted at the site root |

Each slot is the **entire dialog**, not just its form: the account menu owns the open state and
renders your component with `open: boolean` and `onClose: () => void` props injected. A custom
component builds its own `CustomDialog` (header, content and the footer Save button) and calls
`onClose` on dismiss and after a successful submit.

### Behaviour

| Name | Type | Default | Description |
|---|---|---|---|
| `defaultRowAction` | `'click' \| 'double-click' \| 'none'` | `'click'` | Gesture that opens a row when the view schema does not say |
| `rowTooltip` | `boolean` | `true` | Shows the gesture tooltip ("Double-click: Show") when hovering a list row; `false` hides it while rows still open on click |
| `columnSelector` | `boolean` | `false` | Shows the column selector in list views |
| `defaultPerPage` | `number` | `25` | Page size in list views |
| `notificationAutoHideDuration` | `number` | `10000` | Toast lifetime in ms; a single notification can override it through `useNotify` |
| `navigationGuard` | `boolean` | `false` | Asks for confirmation before leaving a form with unsaved changes |
| `draftEnabled` | `boolean` | `false` | Auto-saves unsaved form changes locally and offers to restore them |
| `alwaysEnableSaveButton` | `boolean` | `false` | Keeps the Save button enabled on a form without changes; by default it is disabled until a value changes |
| `clearStoreOnLogout` | `boolean` | `false` | Clears every per-user store key on logout |

## Service config map

Each entry is one backend. The key is the service name used in resource names
(`eshop/product`); `label` promotes the service to a top-level menu group.

```typescript
import {ServiceConfigMap} from '@eluvia/habarico';

const SERVICES: Readonly<ServiceConfigMap> = {
  eshop: {
    url: 'https://api.example.com/api/v1/eshop/admin',
    label: 'E-shop',
    syncPreferences: true,
  },
};
```

| Key | Type | Description |
|---|---|---|
| `url` | `string` | Base URL of the service's admin API |
| `label` | `string` | Optional; creates a top-level menu group for the service |
| `icon` | `ReactNode` | Optional; icon of that menu group |
| `syncPreferences` | `boolean` | Marks this service as the store for [user preferences](../utilities/create-backend-store-backend-synced-preferences.md) |

:::caution
Only one service may set `syncPreferences: true`. If several do, the first wins and the rest are
ignored with a console warning — preferences would otherwise be split across backends.
:::

## Extra menu items

`extraMenuItems` adds entries to the generated menu and can also adjust generated ones: an item
whose `key` matches a generated entry patches it instead of adding a second one.

```typescript
type ExtraMenuItem = {
  key: string;            // required — identifies the item, and matches a generated one
  title?: string;
  priority?: number;      // ordering; defaults to 100
  icon?: ReactNode;
  href?: string;
  items?: ExtraMenuItem[];   // nested items
};
```

```tsx
<SchemaAdmin
  extraMenuItems={[
    {key: 'reports', title: 'Reports', icon: <ReportIcon />, href: '/reports'},
    {
      key: 'eshop',
      items: [{key: 'eshop/product', priority: 1}],   // pull products to the top
    },
  ]}
>
  …
</SchemaAdmin>
```

An item whose `key` matches nothing generated and carries no `title`/`href` is silently dropped —
a mistyped key simply produces no menu entry.

## See also

- [SchemaResource](./schema-resource.md) — declaring the resources inside
- [Providers](../providers/index.md) — everything passed in above
- [Menu](../navigation-components/menu.md) — how the menu is assembled
- [Quickstart](/concepts/guides/quickstart) — this component in a working setup
