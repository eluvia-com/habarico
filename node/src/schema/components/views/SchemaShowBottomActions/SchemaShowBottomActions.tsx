import React from 'react';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

// Renders the schema's bottom_actions at the bottom of a show/read-only detail view. The layout
// (right-aligned, padded, transparent bar) is provided by the `ShowShell` `Toolbar` wrapper, so this
// only supplies the buttons. Unlike the form variant (SchemaFormActions) there is no default Save
// fallback — show views have no save, so when no actions are defined nothing is rendered.
export const SchemaShowBottomActions = () => {
  const {viewSchema} = useViewSchemaContext();
  const bottomActions = viewSchema.detail?.bottomActions;

  if (!bottomActions?.length) return null;

  return <SchemaButtons size="medium" descriptors={bottomActions} variant="contained" />;
};
