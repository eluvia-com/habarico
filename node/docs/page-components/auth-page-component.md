---
title: AuthPage
sidebar_position: 2
---

The sign-in screen: login, forgotten password, optional registration and the MFA step.

[SchemaAdmin](../base-components/schema-admin.md) mounts it by default. Pass it explicitly to
supply your own forms, or replace `authPage` entirely for a different screen.

## Example

```tsx
import {SchemaAdmin, AuthPage} from 'habarico';

<SchemaAdmin
  authPage={() => <AuthPage RegisterComponent={RegisterForm} />}
  {...rest}
/>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `LoginComponent` | `LoginComponent` | built-in form | Replaces the login form |
| `ForgottenPasswordComponent` | `ForgottenPasswordComponent` | built-in form | Replaces the forgotten-password form |
| `RegisterComponent` | `RegisterComponent` | — | Adds a registration form; a link to it appears on the login form only when this is set |
| `onLoginSuccess` / `onLoginError` | `() => void` / `(error: Error) => void` | — | Run after a successful or failed sign-in |
| `onRegisterSuccess` / `onRegisterError` | `() => void` / `(error: Error) => void` | — | The same for the registration form |
| `onForgottenPasswordSuccess` / `onForgottenPasswordError` | `() => void` / `(error: Error) => void` | — | The same for the forgotten-password form |
| `logo` | `LogoSlot` | the "no logo" placeholder | `{Component}` — logo in the header |
| `availableLanguages` | `LayoutLanguage[]` | — | Languages offered by the header switcher |
| `loginNotice` | `LoginNoticeSlot` | — | `{Component}` — your content under the login form, see below |

Mounted by `SchemaAdmin`, the last three are filled from its `LogoComponent`, `availableLanguages`
and `LoginNoticeComponent` props. The page is framed by [AuthLayout](../layout-components/auth-layout.md).

## Login notice

`loginNotice` renders your component under the login form and its MFA steps, above the hint about
signing in on a shared computer. It is typically a link to your terms of service, but any content
fits; the page renders it as is, so it brings its own typography:

```tsx
import {useTranslate} from 'react-admin';
import {Link, Typography} from '@mui/material';
import {SchemaAdmin} from 'habarico';

const TermsNotice = () => {
  const translate = useTranslate();
  return (
    <Typography variant="caption" color="text.secondary">
      {translate('eshop.login.consent')}{' '}
      <Link href="https://shop.example.com/terms" target="_blank" rel="noopener">
        {translate('eshop.login.terms')}
      </Link>
    </Typography>
  );
};

<SchemaAdmin LoginNoticeComponent={TermsNotice} {...rest} />
```

With your own `authPage` on `SchemaAdmin`, pass `loginNotice` to the `AuthPage` you render there.

Which steps appear depends on the [AuthProvider](../providers/auth-provider.md): without
`resetPassword` there is no forgotten-password link, without `requestMfaChallenge` /
`verifyMfa` there is no MFA step, and without `getSsoLoginMethods` the login form shows no SSO
buttons — see [SSO login methods](../providers/auth-provider.md#sso-login-methods).

## See also

- [AuthProvider](../providers/auth-provider.md) — the flows behind this page
- [ResetPasswordPage](./reset-password-page-component.md) — where the e-mail link leads
