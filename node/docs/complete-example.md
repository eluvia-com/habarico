---
title: Complete example
sidebar_position: 13
---

One admin application from entry point to a customised field — the frontend counterpart of the
Python and Ruby [complete examples](/python/complete-example), against the same e-shop backend.

## The entry point

```tsx
// App.tsx
import {SchemaAdmin, SchemaResource} from '@eluvia/habarico';

import {ColorField} from './fields/ColorField';
import {ColorInput} from './inputs/ColorInput';
import {PublishButton} from './buttons/PublishButton';
import {authProvider} from './auth';
import {iconsMap} from './icons';

const SERVICES = {
  eshop: {
    url: import.meta.env.VITE_API_URL + '/api/v1/eshop/admin',
    label: 'E-shop',
    syncPreferences: true,
  },
} as const;

export const App = () => (
  <SchemaAdmin
    serviceConfigMap={SERVICES}
    authProvider={authProvider}
    iconsMap={iconsMap}
    columnSelector
    navigationGuard
    draftEnabled
    availableLanguages={[{locale: 'cs-CZ', title: 'Čeština'}, {locale: 'en', title: 'English'}]}
    // A colour swatch is a concept, not one field — match on the format everywhere.
    fieldProvider={({format, props}) =>
      format === 'color' ? <ColorField {...props} /> : undefined
    }
    inputProvider={({format, props}) =>
      format === 'color' ? <ColorInput {...props} /> : undefined
    }
  >
    <SchemaResource name="eshop/product" />
    <SchemaResource name="eshop/category" />
    <SchemaResource
      name="eshop/order"
      // Publishing is specific to orders — keep the override local to the resource.
      buttonProvider={({schema, recordPk, props}) =>
        schema.resource?.endpoint?.actionName === 'publish' ? (
          <PublishButton recordId={recordPk} {...props} />
        ) : undefined
      }
    />
  </SchemaAdmin>
);
```

Everything the three resources render — columns, filters, forms, tabs, actions, the menu — comes
from the backend schemas. The only frontend code above is the three overrides.

## A custom display component

```tsx
// fields/ColorField.tsx
import {useRecordContext} from 'react-admin';
import get from 'lodash/get';

// The provider hands over the full prepared props object — declare just the subset you use.
type ColorFieldProps = {
  source: string;
  emptyText?: string;
};

export const ColorField = ({source, emptyText}: ColorFieldProps) => {
  const record = useRecordContext();
  const value = get(record, source) as string | undefined;

  if (!value) return <span>{emptyText}</span>;

  return (
    <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
      <span style={{width: 14, height: 14, borderRadius: 3, background: value}} />
      {value}
    </span>
  );
};
```

## A custom input

```tsx
// inputs/ColorInput.tsx
import {ReactNode} from 'react';
import {useInput, Validator} from 'react-admin';

type ColorInputProps = {
  source: string;
  label?: ReactNode;
  helperText?: ReactNode;
  validate?: Validator | Validator[];
};

export const ColorInput = ({source, label, helperText, validate}: ColorInputProps) => {
  const {field, fieldState} = useInput({source, validate});

  return (
    <label>
      {label}
      <input type="color" value={field.value ?? '#ffffff'} onChange={field.onChange} />
      <small>{fieldState.error?.message ?? helperText}</small>
    </label>
  );
};
```

## A custom action button

```tsx
// buttons/PublishButton.tsx
import {Button, useNotify} from 'react-admin';
import {useCallAction} from '@eluvia/habarico';

export const PublishButton = ({recordId, label, ...rest}) => {
  const notify = useNotify();
  const {callAction, isLoading} = useCallAction({
    resource: 'eshop/order',
    method: 'post',
    path: '/publish/',
    isBackground: true,
    onDone: () => notify('Order published'),
  });

  return (
    <Button
      {...rest}
      label={label}
      disabled={isLoading}
      onClick={() => callAction({id: recordId})}
    />
  );
};
```

`isBackground` is what makes this survive a reload: on mount the hook asks for the current state,
so a publish that is still running is picked up instead of started again.

## A page of your own

Custom screens live next to the generated ones and use the same shell:

```tsx
// pages/SalesReport.tsx
import {DashboardContent, ViewContent, PortalBreadcrumbItem, useGetAll} from '@eluvia/habarico';

export const SalesReport = () => {
  const {data: orders = [], isLoading} = useGetAll('eshop/order', {
    filter: {status: 'published'},
    sort: {field: 'placed_at', order: 'DESC'},
  });

  return (
    <DashboardContent maxWidth="lg">
      <ViewContent
        title="Sales report"
        breadcrumbs={
          <>
            <PortalBreadcrumbItem path="/eshop/order">Orders</PortalBreadcrumbItem>
            <PortalBreadcrumbItem>Sales report</PortalBreadcrumbItem>
          </>
        }
      >
        {isLoading ? <Loading /> : <ReportTable rows={orders} />}
      </ViewContent>
    </DashboardContent>
  );
};
```

:::caution
`useGetAll` walks every page of the resource. It is right for a report or an export, and wrong for
anything the user browses — there, React Admin's paginated `useGetList` is the one to reach for.
:::

## See also

- [Quickstart](/concepts/guides/quickstart) — the same setup with the backend half
- [Custom field type end to end](/concepts/guides/custom-field-type) — the colour field explained step by step
- [SchemaAdmin](./base-components/schema-admin.md) — every prop used above
- [Providers](./providers/index.md) — the override seams
- [Complete example](/python/complete-example) — the backend that serves these schemas
