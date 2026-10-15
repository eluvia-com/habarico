---
title: ResetPasswordPage
sidebar_position: 3
---

The screen the password-reset e-mail links to: set a new password using the token from the URL.

[SchemaAdmin](../base-components/schema-admin.md) mounts it by default. Pass it explicitly to hook
into the result.

## Example

```tsx
import {SchemaAdmin, ResetPasswordPage} from '@eluvia/habarico';

<SchemaAdmin
  resetPasswordPage={<ResetPasswordPage onSuccess={() => redirect('/login')} />}
  {...rest}
/>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `onSuccess` | `() => void` | — | Runs after the password has been set |
| `onError` | `(error: Error) => void` | — | Runs when the reset fails, e.g. an expired token |
| `logo` | `LogoSlot` | the "no logo" placeholder | `{Component}` — logo in the header |
| `availableLanguages` | `LayoutLanguage[]` | — | Languages offered by the header switcher |

The token is read from the URL, and the new password is submitted through `setPassword` on the
[AuthProvider](../providers/auth-provider.md).

## See also

- [AuthPage](./auth-page-component.md) — where the reset is requested
- [AuthProvider](../providers/auth-provider.md) — `resetPassword` and `setPassword`
