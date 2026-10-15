import React from 'react';
import {Resource, required} from 'react-admin';
import {SaveButton} from '@admin/components/buttons/SaveButton';
import {TextInput} from '@admin/components/inputs/TextInput';
import {CreateShell} from '@admin/components/views/CreateShell';
import {PropertyFormLayout} from '@admin/components/views/PropertyFormLayout';
import {ViewDialog} from '@admin/components/views/ViewDialog';
import {Icon, IconType} from '@design/atoms/Icon';
import {Panel} from '@design/molecules/Panel';
import {PanelContent} from '@design/molecules/PanelContent';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {PanelGrid} from '@design/organisms/PanelGrid';
import {Button} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {AdminStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/* Cancel + Save rendered inside the form context as the CreateShell form footer toolbar. */
const dialogFormActions = (
  <>
    <Button color="inherit" startIcon={<Icon icon={IconType.Close} />}>
      Cancel
    </Button>
    <SaveButton variant="contained" label="Save" icon={<Icon icon={IconType.CheckCircle} />} />
  </>
);

/**
 * The "New owner" create dialog, wired through the real admin view shell on a **dialog surface**:
 * the `ViewDialog` shell provides the dialog chrome (`CustomDialog` + `CustomDialogTitle` +
 * `DialogActions`) and its portal placeholders, and `CreateShell` (owns `<Create>` + `ViewContent` +
 * `FormShell`) renders inside it, its inputs laid out as label + input rows by `PropertyFormLayout`
 * inside design `Panel`s — the same layout as the `PropertyEdit` view.
 *
 * `ViewDialog` marks the surface `presentation: 'dialog'` via `ViewPresentationContext`,
 * so the shell's `ViewContent` drops its breadcrumbs and portals the view **title into the dialog
 * header**, the **subtitle** under it, and the form's **Save / Cancel into the dialog footer**
 * (`DialogActions`). On a page the same shell would portal into `DashboardLayout` instead — the
 * surface is chosen entirely by which presentation is in context. Correct-usage counterpart of
 * `design/pages/NewOwnerDialog`.
 */
const NewOwnerCreate = () => (
  <ViewDialog open disableClose maxWidth="md" fullWidth>
    <CreateShell
      controllerProps={{resource: 'owners', redirect: false}}
      title="New owner"
      subtitle="for property Kyjovská 578/13, Prague – Michle"
      formActions={dialogFormActions}
    >
      <PanelGrid>
        <Panel variant="nested" fullHeight>
          <PanelHeader label="Name & surname" />
          <PanelContent>
            <PropertyFormLayout>
              <TextInput source="title_before" label="Title before name" size="small" />
              <TextInput
                source="first_name"
                label="First name"
                validate={required()}
                size="small"
              />
              <TextInput source="surname" label="Surname" validate={required()} size="small" />
              <TextInput source="title_after" label="Title after name" size="small" />
            </PropertyFormLayout>
          </PanelContent>
        </Panel>
        <Panel variant="nested" fullHeight>
          <PanelHeader label="Contact" />
          <PanelContent>
            <PropertyFormLayout>
              <TextInput source="email" label="Email" size="small" />
              <TextInput source="phone" label="Phone" size="small" />
            </PropertyFormLayout>
          </PanelContent>
        </Panel>
      </PanelGrid>
    </CreateShell>
  </ViewDialog>
);

const meta: Meta<typeof NewOwnerCreate> = {
  title: 'admin/pages/NewOwnerDialog',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof NewOwnerCreate>;

/**
 * Live React Admin create dialog through the `CreateShell` view shell inside the `ViewDialog` shell:
 * a real `<Create>` form presented in a `PanelGrid` of `Panel`s, with its title / subtitle portaled
 * into the dialog header and its Save / Cancel into the dialog footer via `ViewPresentationContext`.
 * The admin-layer counterpart of `design/pages/NewOwnerDialog`.
 */
export const Default: Story = {
  render: () => (
    <AdminStoryShell initialEntry="/owners/create">
      <Resource name="owners" create={NewOwnerCreate} recordRepresentation="full_name" />
    </AdminStoryShell>
  ),
};
