import React, {ReactNode} from 'react';
import {RootRecordContextProvider} from '@admin/contexts/RootRecordContext';
import {IsLastPanelContextProvider} from '@design/contexts/IsLastPanelContext';
import {
  DEFAULT_PANEL_GRID_COLUMNS,
  PanelGridContextProvider,
} from '@design/contexts/PanelGridContext';
import {FieldSchemaMapProvider} from '@schema/contexts/FieldSchemaMapContext';
import {ParentBoxContext} from '@schema/contexts/ParentBoxContext';

type ResetBoxProviderProps = {
  children: ReactNode;
};

// Resets all box-layout contexts to their surface root defaults. A schema view can be
// rendered inside a dialog, and React context flows through portals - so without a
// reset the view would inherit whatever box context happened to surround the element
// that opened the dialog (a nested grid width, a parent record, a non-last box, ...).
// Resetting here makes every view start from a clean root, exactly as if it were
// mounted at the top of its surface:
//   - FieldSchemaMap / RootRecord: drop the surrounding record/field schema
//   - PanelGridContext: full 12 columns again
//   - IsLastPanelContext: back to the last path (true) so the view's boxes can grow
// `InsidePanelContext` is deliberately NOT reset: whether the surface above is a card is the
// surface's own statement, not something a view can derive. `Panel` sets it, and the overlay
// surfaces that are a card without being a `Panel` set it too (`ViewDialog`, `ViewSidePanel`).
// Deriving it here from the presentation used to lie in one direction: `presentation` falls back to
// `'page'` whenever no `ViewPresentationProvider` is mounted, so a view rendered inside a card
// (a dashboard widget, an embedded composition) claimed a page surface and its first box drew a
// card inside that card.
//   - ParentBoxContext: drop the surrounding box name/schema - without this, a view opened
//     from a row action nested inside a box (e.g. a list box's own "edit" row action) would
//     inherit that box's `parentBoxName`, prefixing every `getBoxName()` call the new view
//     makes (form group names, tab keys, ...) with a path that belongs to a completely
//     unrelated resource tree.
export const ResetBoxProvider = ({children}: ResetBoxProviderProps) => {
  return (
    <ParentBoxContext.Provider value={undefined}>
      <FieldSchemaMapProvider schemaMap={undefined}>
        <RootRecordContextProvider value={undefined}>
          <PanelGridContextProvider value={DEFAULT_PANEL_GRID_COLUMNS}>
            <IsLastPanelContextProvider value={true}>{children}</IsLastPanelContextProvider>
          </PanelGridContextProvider>
        </RootRecordContextProvider>
      </FieldSchemaMapProvider>
    </ParentBoxContext.Provider>
  );
};
