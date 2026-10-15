import React from 'react';
import {ResponsiveCount} from '@design/hooks/useOverflowCount';
import {SchemaButtons, SchemaButtonsProps} from '@schema/components/buttons/SchemaButtons';

// Row actions are dense icon buttons; keep more inline as the viewport widens. Counts are real buttons
// (the `⋮` trigger is always extra); `useOverflowCount` (inside SchemaButtons) resolves the breakpoint,
// so no `useMediaQuery` hook is needed here.
const ROW_ACTION_SLOTS: ResponsiveCount = {xs: 2, md: 4, lg: 5};

export const SchemaDatagridRowActions = (props: SchemaButtonsProps) => (
  <SchemaButtons
    surface={'iconButton'}
    size={'small'}
    isList={true}
    // Row buttons are per-record: when no explicit descriptors are given, generate only record-scoped
    // (`is_detail`) actions — collection actions like create/export belong in the toolbar, not on rows.
    scope={'detail'}
    maxVisibleButtons={ROW_ACTION_SLOTS}
    {...props}
  />
);
