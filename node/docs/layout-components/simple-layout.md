---
title: SimpleLayout
sidebar_position: 3
---

A centred page with a logo and nothing else — no menu, no header actions.

Use it for a standalone screen that is not part of the admin shell: an error page, a public
confirmation, a maintenance notice.

## Example

```tsx
import {SimpleLayout} from 'habarico';

<SimpleLayout logo={{Component: Logo}} compact>
  <NotFoundMessage />
</SimpleLayout>
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `children` (required) | `ReactNode` | — | Page content |
| `compact` | `boolean` | `false` | Narrows the content column |
| `logo` | `LogoSlot` | — | `{Component}` — logo in the header |
| `language` | `LanguageSlot` | — | `{availableLanguages}` — the language popover |
| `appearance` | `AppearanceSlot` | — | `true` or `{labels?, tooltip?, header?}` — the light/dark toggle |
| `help` | `HelpSlot` | — | `true` or `{label?, Component?}` — the button and dialog offering help |
| `sx` | `SxProps<Theme>` | — | MUI style override |

## See also

- [AuthLayout](./auth-layout.md) — the same idea for sign-in screens
- [DashboardLayout](./dashboard-layout.md) — the full admin shell
