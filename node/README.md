# habarico

Habarico is a schema-driven admin library for React. It fetches the JSON schemas a Habarico backend
exposes and renders a complete admin interface from them at runtime — lists, detail pages, forms,
actions, menus and dashboards — without a hand-written screen per resource. Every generated part
can be replaced with a component of your own.

Built on [React Admin](https://marmelab.com/react-admin/), MUI v7 and MUI X v9; runs on React 18
or 19.

## Installation

```bash
pnpm add habarico
```

Peer dependencies (React, React Admin, MUI) are not bundled — install them in the project at the
same versions the library declares.

> **Router requirement:** the unsaved-changes guard uses React Router's `useBlocker`, which needs a
> data router. Let `SchemaAdmin` create one itself, or wrap it in `createBrowserRouter` — a legacy
> `<BrowserRouter>` silently disables the guard.

## Local development against a checkout

To run a project against your working copy instead of the published package, link it from the
project directory — the free library first, the paid one second:

```bash
pydev link-library <path-to-libs>/habarico-base/node <path-to-libs>/habarico-enterprise/node-enterprise
```

`<path-to-libs>` is the directory holding your library checkouts — the same placeholder the Ruby services use in their compose files. Relative or absolute, both work.

Link only what you develop; either package works on its own. When you link both, the order matters —
`habarico-enterprise` resolves its own `habarico` through the project, so the free library
has to be linked first or both end up with their own copy of React.

```bash
pnpm watch          # in the library you edit
pydev unlink-library <same paths>
```

See [Installation](https://docs.habarico.com/node/installation) for the details.

## Quick start

```tsx
import {SchemaAdmin, SchemaResource} from 'habarico';

const SERVICES = {
  eshop: {
    url: 'https://api.example.com/api/v1/eshop/admin',
    label: 'E-shop',
  },
} as const;

const App = () => (
  <SchemaAdmin
    schemaProvider={schemaProvider}
    authProvider={authProvider}
    dataProviderFactory={dataProviderFactory}
    serviceConfigMap={SERVICES}
  >
    <SchemaResource name="eshop/product" />
    <SchemaResource name="eshop/order" />
  </SchemaAdmin>
);
```

That is the whole frontend: the resources render themselves from the schemas the backend serves.

## Documentation

Full documentation is at **[docs.habarico.com/node](https://docs.habarico.com/node/intro)** — this file
is only a quick start.

| Section | What it covers |
| --- | --- |
| [Installation](https://docs.habarico.com/node/installation) | Packages, the router requirement, local development against a checkout |
| [Base components](https://docs.habarico.com/node/base-components/) | `SchemaAdmin` and `SchemaResource` — every prop |
| [View components](https://docs.habarico.com/node/view-components/) | List, show, create, edit and action views |
| [Providers](https://docs.habarico.com/node/providers/) | Auth, data and schema providers, and the customisation registries |
| [Input](https://docs.habarico.com/node/input-components/) and [field components](https://docs.habarico.com/node/field-components/) | Every built-in input and field type |
| [Hooks](https://docs.habarico.com/node/hooks/) | The hooks behind the generated screens |
| [Dashboard](https://docs.habarico.com/node/dashboard/) | Widgets, data sources and the add-widget wizard |
| [Types and schemas](https://docs.habarico.com/node/types-and-schemas/) | The shape of what the backend sends |

The backends serving those schemas are documented at
[docs.habarico.com/python/intro](https://docs.habarico.com/python/intro) and
[docs.habarico.com/ruby/intro](https://docs.habarico.com/ruby/intro); the contract between them is the
[API reference](https://docs.habarico.com/api).

The architecture of the library itself — its four layers and what belongs where — is documented in
`src/foundation/README.md`, `src/design/README.md`, `src/admin/README.md` and
`src/schema/README.md`, next to the code they describe.

## License

[MIT](LICENSE)
