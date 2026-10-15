import {createContext, useContext} from 'react';
import {ViewSchemaContextType} from './types';

export const ViewSchemaContext = createContext<ViewSchemaContextType | undefined>(undefined);

export const useViewSchemaContext = () => {
  const context = useContext(ViewSchemaContext);
  if (context === undefined)
    throw new Error('ViewSchemaContext was used outside ViewSchemaProvider');

  // `list` / `show` views are inherently read-only; an `action` view is read-only too when its box
  // is (e.g. a routed action view that just presents a read-only list, with no form to submit).
  const readOnly =
    ['list', 'show'].includes(context.viewSchema.type) ||
    Boolean(context.viewSchema.detail?.box?.readOnly);
  return {...context, readOnly};
};
