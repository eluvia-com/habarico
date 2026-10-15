---
title: Form extensions
sidebar_position: 3
---

A form-scoped registry of extra nodes — dialogs, overlays — that a component deep inside a form
registers by id, and that [FormShell](../layout-components/form-shell.md) renders at the form root.

The node ends up **inside** the react-hook-form and record contexts without being nested where the
registrant sits, so it can read and write the form's fields. No portal is involved.

## useFormExtensions

```typescript
import {useFormExtensions} from '@eluvia/habarico';

const {formExtensions, registerFormExtension, unregisterFormExtension} = useFormExtensions();
```

| Name | Type | Description |
|---|---|---|
| `formExtensions` | `Record<string, ReactNode>` | The current registry — what `FormShell` renders |
| `registerFormExtension` | `(id: string, node: ReactNode) => void` | Registers (or replaces) the node under that id |
| `unregisterFormExtension` | `(id: string) => void` | Removes it again |

## Example

```tsx
const AI_ASSISTANT_ID = 'ai-assistant';

const {registerFormExtension, unregisterFormExtension} = useFormExtensions();

useEffect(() => {
  registerFormExtension(AI_ASSISTANT_ID, <MyFormOverlay />);
}, [registerFormExtension]);

useEffect(() => () => unregisterFormExtension(AI_ASSISTANT_ID), [unregisterFormExtension]);
```

Registering under an id that already exists replaces the node, so re-registering on every render
of a changed node is safe — but unregister on unmount, otherwise a stale extension is rendered
into the next form.

:::caution
Outside a `FormExtensionsProvider` the hook returns a **no-op registry**: an empty
`formExtensions` and register/unregister functions that do nothing. Nothing throws, and nothing
renders either — which is why a component relying on this API silently does nothing outside a
form. `SchemaAdmin` provides the registry around the whole admin.
:::

## See also

- [SchemaAiAssistantButton](./ai-assistant-button.md) — the built-in user of this API
- [FormShell](../layout-components/form-shell.md) — the form the node is mounted into
