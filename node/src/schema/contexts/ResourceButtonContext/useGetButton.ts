import {createContext, useContext} from 'react';
import {Identifier} from 'react-admin';
import {ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useSchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {ActionSchema, GlobalViewSchema} from '@schema/types';
import {ResourceButtonProviderState} from './types';

export const ResourceButtonProviderContext = createContext<ResourceButtonProviderState | undefined>(
  undefined
);

type GetButtonElementProps = {
  resource: string;
  schema: ActionSchema;
  viewSchema?: GlobalViewSchema;
  recordPk?: Identifier;
  reference?: string;
  target?: string;
  props: ActionButtonProps;
};

export function useGetButton() {
  const {buttonProvider, defaultButtonProvider} = useSchemaRootContext();
  const resourceButtonProvider = useContext(ResourceButtonProviderContext);

  return ({
    resource,
    schema,
    viewSchema,
    recordPk,
    reference,
    target,
    props,
  }: GetButtonElementProps) => {
    if (resourceButtonProvider) {
      const buttonWithProps = resourceButtonProvider({
        schema,
        viewSchema,
        recordPk,
        reference,
        target,
        props,
      });
      if (buttonWithProps === null) return;
      if (buttonWithProps) return buttonWithProps;
    }
    if (buttonProvider) {
      const buttonWithProps = buttonProvider({
        resource,
        schema,
        viewSchema,
        recordPk,
        reference,
        target,
        props,
      });
      if (buttonWithProps === null) return;
      if (buttonWithProps) return buttonWithProps;
    }
    return defaultButtonProvider({
      resource,
      schema,
      viewSchema,
      recordPk,
      reference,
      target,
      props,
    });
  };
}
