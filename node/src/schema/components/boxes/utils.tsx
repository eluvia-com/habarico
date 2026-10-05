import React, {ReactNode} from 'react';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {AnyActionDescriptor} from '@schema/types';

// The action slots every box shares — simple, list and gallery — in the button design each slot
// has, so the three render them identically. An entry bound to a listed resource rather than the
// box's own record says so in its `reference`, and links back to the record shown through
// `reference.params._target`. Both builders return undefined when there is nothing to render, so
// the slot stays empty instead of holding an empty toolbar.

/** The box's `toolbarActions`, rendered in its header in the design of a view toolbar. */
export const buildBoxHeaderActions = (descriptors: AnyActionDescriptor[] | undefined): ReactNode =>
  descriptors?.length ? (
    <SchemaButtons
      size="small"
      variant="contained"
      maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
      iconOnly="sm"
      descriptors={descriptors}
    />
  ) : undefined;

/** The box's `bottomActions`, rendered full-size in its footer. */
export const buildBoxBottomActions = (descriptors: AnyActionDescriptor[] | undefined): ReactNode =>
  descriptors?.length ? (
    <SchemaButtons size="medium" variant="contained" descriptors={descriptors} />
  ) : undefined;
