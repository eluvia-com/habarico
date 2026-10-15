import React from 'react';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {ResponsiveCount} from '@design/hooks/useOverflowCount';
import {useHeaderActionsDensity} from '@design/layouts/shared/HeaderActions';
import {SchemaButtons, SchemaButtonsProps} from '@schema/components/buttons/SchemaButtons';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';

export type SchemaViewToolbarActionsProps = Omit<SchemaButtonsProps, 'viewSchema,viewName,isList'>;

export const SchemaViewToolbarActions = (props: SchemaViewToolbarActionsProps) => {
  const {viewSchema} = useViewSchemaContext();
  const {presentation} = useViewPresentation();
  const headerDensity = useHeaderActionsDensity();

  const isList = viewSchema.type === 'list';
  const descriptors = isList ? viewSchema.list?.toolbarActions : viewSchema.detail?.toolbarActions;

  // On a full page the toolbar is portaled into the layout header (HAB-674), which has room for
  // only one or two full buttons before the search toggle — the rest overflow into a `⋮` menu.
  const isHeader = presentation === 'page';

  // In the docked side panel the header is narrow, so render the actions as compact, small
  // icon buttons (the `⋮` overflow trigger mirrors this). Elsewhere they stay full contained buttons.
  const isPanel = presentation === 'panel';

  // In a dialog the toolbar sits in the compact dialog title bar, so the actions render as small
  // contained buttons (still full buttons, unlike the panel's icon buttons).
  const isDialog = presentation === 'dialog';

  // Inline button counts by breakpoint — `useOverflowCount` (inside `SchemaButtons`) runs the media
  // queries, so this stays declarative. Counts are real buttons; the `⋮` trigger is always extra. Below
  // `sm` the header row also carries the nav trigger plus every enabled top-bar icon (search,
  // notifications, account, …), so there's no room left for even one icon-only button next to the `⋮`
  // trigger — showing one risked pushing the whole row into wrapping on the narrowest phones (HAB-709).
  // From `sm` up the header has room for one full button (two on wide screens).
  //
  // On top of that ladder the layout measures its header row (`useHeaderActionsDensity`): when a long
  // breadcrumb trail would be squeezed out, it asks for icon-only buttons, then for every action in
  // the `⋮` menu — the viewport alone can't tell a short trail from a long one.
  const headerCompaction = isHeader ? headerDensity : undefined;
  const headerButtons: ResponsiveCount = headerCompaction === 'menu' ? 0 : {xs: 0, sm: 1, lg: 2};
  const maxVisibleButtons: ResponsiveCount = isHeader ? headerButtons : {xs: 3, md: 4, lg: 5};
  const iconOnly = headerCompaction && headerCompaction !== 'full' ? true : 'sm';

  // Pairs with the `xs: 0` budget above: without it `OverflowToolbar`'s default floor (1) would still
  // force one button inline. `useOverflowCount`'s "would save nothing" guard still keeps a lone action
  // inline even at `minVisible: 0`, since replacing a single icon button with the trigger buys back no
  // width — this only collapses everything when there are two or more actions to hide.
  const minVisibleButtons = isHeader ? 0 : undefined;

  return (
    <SchemaButtons
      variant="contained"
      surface={isPanel ? 'iconButton' : undefined}
      size={isPanel || isDialog ? 'small' : 'medium'}
      maxVisibleButtons={maxVisibleButtons}
      minVisibleButtons={minVisibleButtons}
      iconOnly={iconOnly}
      isList={isList}
      descriptors={descriptors}
      viewName={viewSchema.name}
      {...props}
    />
  );
};
