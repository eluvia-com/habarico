import React from 'react';
import {ReferenceField, Resource} from 'react-admin';
import {BooleanField} from '@admin/components/fields/BooleanField';
import {NumberField} from '@admin/components/fields/NumberField';
import {TextField} from '@admin/components/fields/TextField';
import {PropertyShowLayout} from '@admin/components/views/PropertyShowLayout';
import {ShowShell} from '@admin/components/views/ShowShell';
import {Button} from '@design/atoms/Button';
import {Icon, IconType} from '@design/atoms/Icon';
import {Panel} from '@design/molecules/Panel';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {PanelGrid, PanelGridItem} from '@design/organisms/PanelGrid';
import {Meta, StoryObj} from '@storybook/react-vite';
import {AdminStoryShell, PropertyHero, SeedBreadcrumbs} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/* -- bottom_actions slot: ShowShell wraps this in the shared Toolbar (right-aligned, padded),
      so it only supplies the button(s) -- */
const PropertyBottomActions = () => (
  <Button variant="contained" startIcon={<Icon icon={IconType.Edit} size={18} />} disableElevation>
    Edit property
  </Button>
);

/**
 * The property detail, wired through the real admin view shell: the `ShowShell` shell now owns the
 * React Admin `<Show>` controller (record context + skeleton, `component="div"` so it adds no card),
 * laying its content — our `ObjectHero` + `Panel`s — into the card-less `ViewContent`, with the
 * actions bar in the `bottomActions` slot. Correct-usage counterpart of `design/pages/PropertyDetail`.
 */
const BREADCRUMBS = [
  {title: 'Dashboard', path: '/'},
  {title: 'Properties', path: '/properties'},
  {title: 'Detail'},
];

const PropertyShow = () => (
  <ShowShell toolbarActions={<PropertyBottomActions />}>
    <SeedBreadcrumbs items={BREADCRUMBS} />
    <PropertyHero />
    <PanelGrid>
      <PanelGridItem xs={12} md={6}>
        <Panel fullHeight collapsible>
          <PanelHeader label="Basic properties" />
          <PanelContent>
            <PropertyShowLayout>
              <TextField source="type" />
              <TextField source="layout" />
              <NumberField source="area" />
              <TextField source="unit_number" />
              <NumberField source="floor_number" />
              <ReferenceField source="owner_id" reference="owners" label="Owner" />
            </PropertyShowLayout>
          </PanelContent>
        </Panel>
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <Panel fullHeight collapsible>
          <PanelHeader label="Technical & status" />
          <PanelContent>
            <PropertyShowLayout>
              <BooleanField source="residential" />
              <BooleanField source="barrier_free" />
              <TextField source="heating" />
              <BooleanField source="complete" />
              <BooleanField source="active" />
            </PropertyShowLayout>
          </PanelContent>
        </Panel>
      </PanelGridItem>
    </PanelGrid>
  </ShowShell>
);

const meta: Meta<typeof PropertyShow> = {
  title: 'admin/pages/PropertyDetail',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof PropertyShow>;

/**
 * Live React Admin detail screen through the `ShowShell` view shell: `<Show>` reads the record and
 * renders it as `ObjectHero` + `Panel`s with a `bottomActions` bar — React Admin data, admin-layer
 * presentation. The admin-layer counterpart of `design/pages/PropertyDetail`.
 */
export const Default: Story = {
  render: () => (
    <AdminStoryShell initialEntry="/properties/1/show">
      <Resource name="properties" show={PropertyShow} recordRepresentation="address" />
      <Resource name="owners" recordRepresentation="full_name" />
    </AdminStoryShell>
  ),
};
