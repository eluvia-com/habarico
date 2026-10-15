import React from 'react';
import {ReferenceInput, Resource, SelectInput, required} from 'react-admin';
import {BooleanInput} from '@admin/components/inputs/BooleanInput';
import {ChoicesInput} from '@admin/components/inputs/ChoicesInput';
import {NumberInput} from '@admin/components/inputs/NumberInput';
import {TextInput} from '@admin/components/inputs/TextInput';
import {EditShell} from '@admin/components/views/EditShell';
import {PropertyFormLayout} from '@admin/components/views/PropertyFormLayout';
import {Panel} from '@design/molecules/Panel';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {PanelGrid, PanelGridItem} from '@design/organisms/PanelGrid';
import {Meta, StoryObj} from '@storybook/react-vite';
import {HEATING_OPTIONS, PROPERTY_LAYOUTS, PROPERTY_TYPES} from './_data';
import {AdminStoryShell, PropertyHero, SeedBreadcrumbs} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

const asChoices = (values: string[]) => values.map((value) => ({value, label: value}));

/**
 * The property edit, wired through the real admin view shell: the `EditShell` shell now owns the
 * React Admin `<Edit>` controller (`component="div"` so it adds no card) and renders `FormShell`
 * inside the card-less `ViewContent` — the `SimpleForm` with the themed Submit toolbar plus the draft
 * controller + navigation guard. RA inputs are laid out with `PropertyFormLayout` inside design
 * `Panel`s — the edit-view counterpart of how `PropertyDetail` uses `PropertyShowLayout`. Each
 * input's label moves into the `PropertyList` label column (the input's own label is stripped), so
 * form rows read as label + input pairs. Correct-usage counterpart of `design/pages/PropertyEdit`.
 */
const BREADCRUMBS = [
  {title: 'Dashboard', path: '/'},
  {title: 'Properties', path: '/properties'},
  {title: 'Edit'},
];

const PropertyEdit = () => (
  <EditShell controllerProps={{mutationMode: 'pessimistic', redirect: false}}>
    <SeedBreadcrumbs items={BREADCRUMBS} />
    <PropertyHero />
    <PanelGrid>
      <PanelGridItem xs={12} md={6}>
        <Panel fullHeight>
          <PanelHeader label="Basic properties" />
          <PanelContent>
            <PropertyFormLayout>
              <TextInput source="address" validate={required()} size="small" />
              <ChoicesInput source="type" choices={asChoices(PROPERTY_TYPES)} size="small" />
              <ChoicesInput source="layout" choices={asChoices(PROPERTY_LAYOUTS)} size="small" />
              <NumberInput source="area" size="small" />
              <NumberInput source="floor_number" size="small" />
              <NumberInput source="floor_count" size="small" />
            </PropertyFormLayout>
          </PanelContent>
        </Panel>
      </PanelGridItem>
      <PanelGridItem xs={12} md={6}>
        <Panel fullHeight>
          <PanelHeader label="Technical & status" />
          <PanelContent>
            <PropertyFormLayout>
              <ReferenceInput source="owner_id" reference="owners" label="Owner">
                {/* RA `SelectInput` defaults `margin="dense"` (a top margin the other inputs don't
                    have); force `none` so the ReferenceInput row lines up with its siblings. */}
                <SelectInput
                  label={false}
                  optionText="full_name"
                  fullWidth
                  size="small"
                  margin="none"
                />
              </ReferenceInput>
              <ChoicesInput source="heating" choices={asChoices(HEATING_OPTIONS)} size="small" />
              <TextInput source="unit_number" size="small" />
              <BooleanInput source="residential" size="small" />
              <BooleanInput source="barrier_free" size="small" />
              <BooleanInput source="active" size="small" />
            </PropertyFormLayout>
          </PanelContent>
        </Panel>
      </PanelGridItem>
    </PanelGrid>
  </EditShell>
);

const meta: Meta<typeof PropertyEdit> = {
  title: 'admin/pages/PropertyEdit',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof PropertyEdit>;

/**
 * Live React Admin edit screen through the `FormShell` view shell: `<Edit>` loads the record and
 * `FormShell` binds the inputs in design `Panel`s, laid out as label + input rows by
 * `PropertyFormLayout`, with the shell's themed Submit toolbar. The admin-layer counterpart of
 * `design/pages/PropertyEdit`.
 */
export const Default: Story = {
  render: () => (
    <AdminStoryShell initialEntry="/properties/1">
      <Resource name="properties" edit={PropertyEdit} recordRepresentation="address" />
      <Resource name="owners" recordRepresentation="full_name" />
    </AdminStoryShell>
  ),
};
