import React, {useEffect} from 'react';
import {
  FilterForm,
  Identifier,
  ReferenceField,
  Resource,
  useGetOne,
  useListContext,
  useNotify,
  useRecordContext,
} from 'react-admin';
import {AdminDatagrid} from '@admin/components/datagrid/AdminDatagrid';
import {BooleanField} from '@admin/components/fields/BooleanField';
import {NumberField} from '@admin/components/fields/NumberField';
import {TextField} from '@admin/components/fields/TextField';
import {ChoicesInput} from '@admin/components/inputs/ChoicesInput';
import {SearchInput} from '@admin/components/inputs/SearchInput';
import {ListShell} from '@admin/components/views/ListShell';
import {ViewSidePanel} from '@admin/components/views/ViewSidePanel';
import {useSidePanelController} from '@admin/contexts/SidePanelContext';
import {useViewPresentation} from '@admin/contexts/ViewPresentationContext';
import {IconType} from '@design/atoms/Icon';
import {ButtonDefinition, ButtonsStack} from '@design/molecules/ButtonsStack';
import {PropertyItem} from '@design/molecules/PropertyItem';
import {PropertyList as PropertyListMolecule} from '@design/molecules/PropertyList';
import {Meta, StoryObj} from '@storybook/react-vite';
import {type Property} from './_data';
import {INVOLVEMENTS, PROPERTY_TYPES} from './_data';
import {AdminStoryShell, SeedBreadcrumbs} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

const asChoices = (values: string[]) => values.map((value) => ({value, label: value}));

/* Inline (always-on) filters live in the `<List>` filters slot; drawer filters open from the
   toolbar filter button (fed through `listConfig.filters`). */
const toolbarFilters = [
  <SearchInput key="q" source="q" alwaysOn />,
  // `FilterForm` only renders inline filters marked `alwaysOn`; without it the `type` filter is
  // silently dropped from the toolbar (only Search would show).
  <ChoicesInput key="type" source="type" choices={asChoices(PROPERTY_TYPES)} alwaysOn />,
];
const otherFilters = [
  <ChoicesInput
    key="involvement"
    source="involvement"
    choices={asChoices(INVOLVEMENTS)}
    alwaysOn
  />,
];

const SORT = {field: 'id', order: 'ASC' as const};

// One shared preference-store key so the datagrid's persisted state (column widths, column
// selection) and the toolbar's reset buttons — which read `preferenceKey` from `ListConfigContext` —
// point at the same store entry. Without this the `AdminDatagrid` would fall back to its default
// `properties.datagrid` key while the toolbar acts on `properties.list.datagrid`, so "reset column
// widths" (auto-fit) would clear an unrelated entry and do nothing.
const PREFERENCE_KEY = 'properties.list.datagrid';

const BREADCRUMBS = [
  {title: 'Dashboard', path: '/'},
  {title: 'Properties', path: '/properties'},
];

// --------------------------------------------------------------------------
// Docked side panel
// --------------------------------------------------------------------------

// The panel body renders inside `ViewSidePanel`'s overlay presentation. It portals a title and an
// actions bar into the panel header through `ViewPresentationContext` — exactly how a real schema
// view feeds the header — and renders the record fields as the panel content. `setTitle` / `setActions`
// return portals into the header's title / actions slots (or `undefined` off an overlay surface).
const PropertyPanelBody = ({property}: {property: Property}) => {
  const {setTitle, setActions} = useViewPresentation();
  const notify = useNotify();
  const headerActions: ButtonDefinition[] = [
    {
      label: 'Edit',
      icon: IconType.Edit,
      onClick: () => notify(`Edit “${property.address}”`, {type: 'info'}),
    },
    {
      label: 'Delete',
      icon: IconType.Delete,
      color: 'error',
      onClick: () => notify(`Delete “${property.address}”`, {type: 'warning'}),
    },
  ];
  return (
    <>
      {setTitle(property.address)}
      {setActions(<ButtonsStack surface="iconButton" size="small" buttons={headerActions} />)}
      <PropertyListMolecule>
        <PropertyItem label="ID">{String(property.id)}</PropertyItem>
        <PropertyItem label="Type">{property.type}</PropertyItem>
        <PropertyItem label="Address">{property.address}</PropertyItem>
        <PropertyItem label="Layout">{property.layout}</PropertyItem>
        <PropertyItem label="Area">{`${property.area} m²`}</PropertyItem>
        <PropertyItem label="Involvement">{property.involvement}</PropertyItem>
      </PropertyListMolecule>
    </>
  );
};

// The panel: it receives only the *id* of the selected row (the single source of truth held by the
// `SidePanelController`) and fetches the record for that id itself — the panel sits outside the
// list's `ListContext`, so it re-reads through the data provider rather than the list data. The
// admin `ViewSidePanel` owns the resize / persistent width and the overlay header; the body portals
// its title + actions in.
const PropertyPanelContent = ({id, onClose}: {id: Identifier; onClose: () => void}) => {
  // The controller carries the generic RA `Identifier` (string | number); this resource keys on a
  // numeric id, so narrow it for the typed `useGetOne` lookup.
  const {data: property} = useGetOne<Property>('properties', {id: id as Property['id']});
  // The fake data provider resolves near-instantly, so no loading state is needed in the story —
  // render nothing until the record is available.
  if (!property) {
    return null;
  }
  return (
    <ViewSidePanel onClose={onClose}>
      <PropertyPanelBody property={property} />
    </ViewSidePanel>
  );
};

// The `sidePanel` slot: reads the shared controller mounted by `ListShell` and renders the docked
// preview whenever a row is open. `active` holds the clicked row id; `close()` dismisses it. Nothing
// renders while the panel is closed (the two-column layout collapses back to a single column).
const PropertySidePanel = () => {
  const panel = useSidePanelController<Identifier>();
  if (panel?.active == null) {
    return null;
  }
  return <PropertyPanelContent id={panel.active} onClose={panel.close} />;
};

// --------------------------------------------------------------------------
// Datagrid
// --------------------------------------------------------------------------

// Per-row action buttons. `AdminDatagrid` renders `rowActionButtons` in a fixed trailing column
// inside each row's record context, so it reads the row via `useRecordContext`. Each handler stops
// propagation so the button click doesn't also fire the row activation (which opens the side panel).
const PropertyRowActions = () => {
  const record = useRecordContext<Property>();
  const panel = useSidePanelController<Identifier>();
  const notify = useNotify();
  if (!record) {
    return null;
  }
  const actions: ButtonDefinition[] = [
    {
      label: 'Detail',
      icon: IconType.Visibility,
      onClick: (e) => {
        e.stopPropagation();
        panel?.openView(record.id);
      },
    },
    {
      label: 'Edit',
      icon: IconType.Edit,
      onClick: (e) => {
        e.stopPropagation();
        notify(`Edit “${record.address}”`, {type: 'info'});
      },
    },
    {
      label: 'Delete',
      icon: IconType.Delete,
      color: 'error',
      onClick: (e) => {
        e.stopPropagation();
        notify(`Delete “${record.address}”`, {type: 'warning'});
      },
    },
  ];
  return <ButtonsStack surface="iconButton" buttons={actions} size="small" />;
};

// The datagrid reads the same controller (it renders inside `ListShell`'s `SidePanelProvider`) and
// docks the clicked row into the panel via `openView(record.id)` — passing only the id, exactly as
// the schema list does. `AdminDatagrid` suppresses React Admin's default row navigation, so the
// click opens the panel instead of routing to a detail page.
const PropertiesDatagrid = () => {
  const panel = useSidePanelController<Identifier>();
  const {onSelect} = useListContext();
  // Keep the datagrid's row selection in lockstep with the open panel (`panel.active` is the single
  // source of truth). React Admin highlights a row when its id is in `selectedIds` even with
  // `bulkActionButtons={false}`, so this marks exactly the previewed row as selected — and clears it
  // when the panel closes. Covers both entry points into the panel (row click and the row "Detail"
  // action), since both funnel through `panel.active`.
  const activeId = panel?.active;
  useEffect(() => {
    onSelect(activeId == null ? [] : [activeId]);
  }, [onSelect, activeId]);
  return (
    <AdminDatagrid
      bulkActionButtons={false}
      preferenceKey={PREFERENCE_KEY}
      onRowClick={(record) => panel?.openView(record.id)}
      configurableColumns
      resizableColumns
      rowActionButtons={<PropertyRowActions />}
    >
      <TextField source="type" />
      <TextField source="address" />
      <TextField source="layout" />
      <NumberField source="area" />
      <ReferenceField source="owner_id" reference="owners" label="Owner" />
      <TextField source="involvement" />
      <BooleanField source="complete" />
      <BooleanField source="active" />
    </AdminDatagrid>
  );
};

/**
 * The property list, wired through the real admin view shell: `ListShell` owns the React Admin
 * `<List>` controller, the `ListConfigProvider` and the card-less `ViewContent` frame, and lays an
 * `AdminDatagrid` out on a `ListSurface` card whose toolbar is the default `DatagridActions` (filter
 * drawer + column / sort / config resets, driven by `listConfig`).
 *
 * Passing a `sidePanel` makes `ListShell` mount the `SidePanelProvider`, so the datagrid and the
 * panel share one `SidePanelController`: clicking a row calls `openView(record.id)` and the panel
 * renders from `active` (the selected id) — a single source of truth, no local selection state.
 * Correct-usage counterpart of `design/pages/PropertyList`, driven by a real data provider.
 */
const PropertyList = () => (
  <>
    <SeedBreadcrumbs items={BREADCRUMBS} />
    <ListShell
      resource="properties"
      title="Properties"
      controllerProps={{perPage: 10, exporter: false, sort: SORT}}
      listConfig={{
        preferenceKey: PREFERENCE_KEY,
        sort: SORT,
        filterDefaultValues: {},
        filters: otherFilters,
      }}
      filters={<FilterForm filters={toolbarFilters} />}
      sidePanel={<PropertySidePanel />}
    >
      <PropertiesDatagrid />
    </ListShell>
  </>
);

const meta: Meta<typeof PropertyList> = {
  title: 'admin/pages/PropertyList',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof PropertyList>;

/**
 * Live React Admin list screen inside the admin shell, rendered through the `ListShell` view shell +
 * `AdminDatagrid`: a data-provider-backed list on a `ListSurface` card with inline + drawer filters,
 * the default datagrid toolbar and a paginated grid, restyled into our design system.
 *
 * Click any row to dock a preview panel beside the list: the row id flows through the admin
 * `SidePanelController` (`openView(id)` → `active`) and the panel fetches and shows that property.
 * Click the panel's close button to dismiss it. The admin-layer counterpart of
 * `design/pages/PropertyList`.
 */
export const Default: Story = {
  render: () => (
    <AdminStoryShell initialEntry="/properties">
      <Resource name="properties" list={PropertyList} recordRepresentation="address" />
      <Resource name="owners" recordRepresentation="full_name" />
    </AdminStoryShell>
  ),
};
