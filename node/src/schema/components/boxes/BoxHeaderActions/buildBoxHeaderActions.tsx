import React, {ReactNode} from 'react';
import {Box} from '@mui/material';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {ActionDescriptor, LocalResourceSchema} from '@schema/types';
import {SchemaReferenceToolbarActions} from './SchemaReferenceToolbarActions';

type BoxHeaderActionsParams = {
  reference: string;
  schema?: LocalResourceSchema;
  schemaParams?: Record<string, string>;
  resource: string;
  recordId: string | number;
  target?: string;
  listToolbarActions?: ActionDescriptor[];
  boxToolbarActions?: ActionDescriptor[];
};

// Builds the combined header action node for list/images boxes: the box's explicit reference-bound
// list toolbar actions (`list.toolbarActions`) plus the box's own parent-bound toolbar actions.
// Both use the same button design as the list view's toolbar actions. Only explicitly configured
// actions are rendered here — the resource's default list actions fall back to the filter bar
// (`list.listActions`), not the header. Returns undefined when there is nothing to render so the
// box header slot stays empty instead of rendering an empty toolbar.
export const buildBoxHeaderActions = ({
  reference,
  schema,
  schemaParams,
  resource,
  recordId,
  target,
  listToolbarActions,
  boxToolbarActions,
}: BoxHeaderActionsParams): ReactNode => {
  const hasReferenceToolbarActions = !!listToolbarActions?.length;
  const hasBoxToolbarActions = !!boxToolbarActions?.length;

  if (!hasReferenceToolbarActions && !hasBoxToolbarActions) return undefined;

  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
      {hasReferenceToolbarActions && (
        <SchemaReferenceToolbarActions
          reference={reference}
          schema={schema}
          schemaParams={schemaParams}
          resource={resource}
          recordId={recordId}
          target={target}
          descriptors={listToolbarActions}
        />
      )}
      {hasBoxToolbarActions && (
        <SchemaButtons
          size="small"
          variant="contained"
          maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
          iconOnly="sm"
          descriptors={boxToolbarActions}
        />
      )}
    </Box>
  );
};
