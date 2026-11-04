import React, {ReactNode, useMemo} from 'react';
import {ResourceContextProvider} from 'react-admin';
import {ParentResourceDescriptorsProvider} from '@schema/contexts/ParentResourceDescriptorsContext';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {ActionContext} from '@schema/utils/actionDescriptor';

// Re-establishes the context a linked action runs in: the addressed resource, and — only when the
// address links back to the surrounding record — that record on the parent stack, so a record
// created through the action is prefilled with its foreign key.
export const ActionResourceProvider = ({
  actionContext,
  children,
}: {
  actionContext: ActionContext;
  children: ReactNode;
}) => {
  const parents = useParentResourceDescriptorsContext();
  const {parent} = actionContext;
  const value = useMemo(() => (parent ? [...parents, parent] : parents), [parents, parent]);

  return (
    <ResourceContextProvider value={actionContext.resource}>
      <ParentResourceDescriptorsProvider value={value}>
        {children}
      </ParentResourceDescriptorsProvider>
    </ResourceContextProvider>
  );
};
