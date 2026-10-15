import React, {useDeferredValue} from 'react';
import {AdminUI, AdminUIProps} from 'react-admin';
import {Loading} from '@admin/components/common/Loading';
import {SchemaIdentitySync} from '@schema/components/base/SchemaIdentitySync';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext';
import {useResourceElements} from '@schema/hooks/useResourceElements';

export const DynamicAdminUI = ({children, ...rest}: AdminUIProps) => {
  const {isLoaded} = useSchemaRootContext();

  const resourceElements = useResourceElements();

  // isLoaded means schemas are fetched, but React Admin needs one render cycle
  // to register the resource routes before catchAll is restored.
  const isRoutesReady = useDeferredValue(isLoaded);

  return (
    <>
      {/* Carries React Admin's identity up to `SchemaAdmin`, which scopes the schema fetch and the
          per-user store to it. Locale is not synced: the RA store is its single source of truth. */}
      <SchemaIdentitySync />
      <AdminUI {...rest} catchAll={isRoutesReady ? rest.catchAll : Loading}>
        <>
          {isLoaded && resourceElements}
          {children}
        </>
      </AdminUI>
    </>
  );
};
