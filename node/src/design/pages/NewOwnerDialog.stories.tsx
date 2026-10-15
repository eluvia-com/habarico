import React from 'react';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Grid,
  OutlinedInput,
  TextField,
} from '@mui/material';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../_storyKit';
import {Icon, IconType} from '../atoms/Icon';
import {CustomDialog} from '../molecules/CustomDialog';
import {CustomDialogTitle} from '../molecules/CustomDialogTitle';
import {Panel} from '../molecules/Panel';
import {PanelContent} from '../molecules/PanelContent';
import {PanelHeader} from '../molecules/PanelHeader';
import {PropertyItem} from '../molecules/PropertyItem';
import {PropertyList} from '../molecules/PropertyList';

/* -- reusable bare inputs in the value slot -- */

const TextInput = ({placeholder}: {placeholder?: string}) => (
  <OutlinedInput size={'small'} fullWidth placeholder={placeholder} />
);

const SelectInput = ({options}: {options: string[]}) => (
  <Autocomplete
    options={options}
    size={'small'}
    renderInput={(params) => <TextField {...params} />}
  />
);

/** A form section: a nested, full-height `Panel` so the sections in a grid row are equal height. */
const FormSection = ({label, children}: {label: string; children: React.ReactNode}) => (
  <Panel variant={'nested'} fullHeight>
    <PanelHeader label={label} />
    <PanelContent>{children}</PanelContent>
  </Panel>
);

/**
 * The "New owner" create form — a MUI `Grid` of nested, full-height `Panel` sections (name,
 * contact, address, bank account, note), each a stacked `PropertyList` of bare inputs.
 */
const NewOwnerForm = () => (
  <Grid container spacing={2} alignItems={'stretch'}>
    <Grid size={{xs: 12, md: 4}}>
      <FormSection label={'Name & surname'}>
        <PropertyList columns={1} orientation={'vertical'}>
          <PropertyItem label={'Title before name'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'First name'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'Surname'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'Title after name'}>
            <TextInput />
          </PropertyItem>
        </PropertyList>
      </FormSection>
    </Grid>

    <Grid size={{xs: 12, md: 4}}>
      <FormSection label={'Contact & personal information'}>
        <PropertyList columns={1} orientation={'vertical'}>
          <PropertyItem label={'Email'}>
            <TextInput placeholder={'name@example.com'} />
          </PropertyItem>
          <PropertyItem label={'Phone'}>
            <TextInput placeholder={'+420'} />
          </PropertyItem>
          <PropertyItem label={'Date of birth'}>
            <TextInput placeholder={'DD. MM. YYYY'} />
          </PropertyItem>
          <PropertyItem label={'Gender'}>
            <SelectInput options={['Female', 'Male', 'Other']} />
          </PropertyItem>
          <PropertyItem label={'Marital status'}>
            <SelectInput options={['Single', 'Married', 'Divorced', 'Widowed']} />
          </PropertyItem>
        </PropertyList>
      </FormSection>
    </Grid>

    <Grid size={{xs: 12, md: 4}}>
      <FormSection label={'Address'}>
        <PropertyList columns={1} orientation={'vertical'}>
          <PropertyItem label={'Street'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'House no.'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'Orientation no.'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'ZIP code'}>
            <TextInput />
          </PropertyItem>
          <PropertyItem label={'City'}>
            <TextInput />
          </PropertyItem>
        </PropertyList>
        <FormControlLabel
          sx={{mt: 1}}
          control={<Checkbox size={'small'} defaultChecked />}
          label={'Delivery address is the same as the permanent address'}
        />
      </FormSection>
    </Grid>

    <Grid size={{xs: 12, md: 6}}>
      <FormSection label={'Bank account'}>
        <PropertyList columns={1} orientation={'vertical'}>
          <PropertyItem label={'Account number'}>
            <TextInput placeholder={'000000-0000000000 / 0000'} />
          </PropertyItem>
        </PropertyList>
      </FormSection>
    </Grid>

    <Grid size={{xs: 12, md: 6}}>
      <FormSection label={'Note'}>
        <PropertyList columns={1} orientation={'vertical'}>
          <PropertyItem label={'Note'}>
            <OutlinedInput size={'small'} fullWidth multiline minRows={2} placeholder={'Note'} />
          </PropertyItem>
        </PropertyList>
      </FormSection>
    </Grid>
  </Grid>
);

const noop = () => {};

/**
 * A non-closable `CustomDialog` (`disableClose`): no floating close button and no backdrop /
 * escape dismissal, so it needs no trigger — it just stays open for the mockup.
 */
const NewOwnerDialogPage = () => (
  <CustomDialog open disableClose maxWidth={'lg'} fullWidth>
    <CustomDialogTitle
      title={'New owner'}
      subtitle={'for property Jihlavská 521/62, Prague – Michle'}
    />
    <DialogContent>
      <NewOwnerForm />
    </DialogContent>
    <DialogActions>
      <Button color={'inherit'} startIcon={<Icon icon={IconType.Close} size={18} />} onClick={noop}>
        Cancel
      </Button>
      <Button
        variant={'contained'}
        color={'success'}
        startIcon={<Icon icon={IconType.CheckCircle} size={18} />}
        onClick={noop}
      >
        Save
      </Button>
    </DialogActions>
  </CustomDialog>
);

// `component` is the local, zero-prop `NewOwnerDialogPage`, not `CustomDialog` itself — pointing it
// at `CustomDialog` would auto-infer its full prop table into Controls even though this static
// mockup never reads args.
const meta: Meta<typeof NewOwnerDialogPage> = {
  title: 'design/pages/NewOwnerDialog',
  component: NewOwnerDialogPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof NewOwnerDialogPage>;

/**
 * The "New owner" create dialog — a non-closable `CustomDialog` (`maxWidth="lg"`) whose body is a
 * MUI `Grid` of nested, full-height `Panel` sections (name, contact, address, bank account, note)
 * with Cancel / Save actions. A standalone composition of existing design-layer components.
 */
export const Default: Story = {};
