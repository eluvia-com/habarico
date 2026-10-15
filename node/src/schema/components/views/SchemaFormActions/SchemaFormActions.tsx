import React from 'react';
import {SaveButton} from '@admin/components/buttons/SaveButton';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

export const SchemaFormActions = () => {
  const {viewSchema} = useViewSchemaContext();

  // Form footer buttons keep their label on every screen size — the default for `ActionButton`
  // (`showLabel` defaults to always-on; responsive collapse is opt-in via `showLabel="sm"`), so no
  // extra prop is needed here (HAB-604, HAB-685).
  return viewSchema.detail?.bottomActions ? (
    <SchemaButtons
      size="medium"
      descriptors={viewSchema.detail?.bottomActions}
      variant="contained"
    />
  ) : (
    <SaveButton size="medium" variant="contained" />
  );
};
