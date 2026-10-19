---
title: AuthLayout
sidebar_position: 2
---

Centred layout for screens shown before sign-in: login, password reset, MFA.

The built-in [AuthPage](../page-components/auth-page-component.md) and
[ResetPasswordPage](../page-components/reset-password-page-component.md) use it. Reach for it when
you replace one of those pages but want the same frame.

## Example

```tsx
import {AuthLayout} from 'habarico';

<AuthLayout
  logo={{Component: Logo}}
  language={{availableLanguages}}
  appearance
  help={{label: 'Need help?', Component: SupportInfo}}
>
  <MyLoginForm />
</AuthLayout>
```

## Props

Like the other app shells, every feature is a **slot**: passing it enables the feature and
configures it. Slots whose configuration is all-optional also accept `true`.

| Name | Type | Description |
|---|---|---|
| `children` (required) | `ReactNode` | The form |
| `logo` | `LogoSlot` | `{Component}` — logo in the header |
| `language` | `LanguageSlot` | `{availableLanguages}` — the language popover |
| `appearance` | `AppearanceSlot` | `true` or `{labels?, tooltip?, header?}` — the light/dark toggle |
| `help` | `HelpSlot` | `true` or `{label?, Component?}` — the button and dialog offering help |
| `sx` | `SxProps<Theme>` | MUI style override |

Both toggles work before sign-in, so a user can pick a language and a colour mode on the login
screen. They write to the `SettingsProvider` context — mount one above the layout (`SchemaAdmin`
already does).

## See also

- [AuthPage](../page-components/auth-page-component.md) — the built-in login screen
- [AuthProvider](../providers/auth-provider.md) — the flows behind these screens
- [SimpleLayout](./simple-layout.md) — the same frame for a page that is not a form
