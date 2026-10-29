import React from 'react';
import {ListContextProvider, useList} from 'react-admin';
import {PRODUCTS, PRODUCTS_RESOURCE, habRecord, redirectView} from '@schema/components/_data';
import {Showcase, ShowcaseStack, withSchemaInputShell} from '@schema/components/_storyKit';
import type {ActionSchema, HabRecord} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaButton} from './SchemaButton';

const RECORDS: HabRecord[] = PRODUCTS.map((product) => habRecord(PRODUCTS_RESOURCE, product));

// One action schema per `type` the button provider dispatches on. These are *schemas*, not
// descriptors: a descriptor names an action, a schema is the action.
const VIEW_ACTION: ActionSchema = {
  type: 'view',
  isDetail: true,
  label: 'Detail',
  icon: 'Visibility',
  view: redirectView('show'),
};

const RESOURCE_ACTION: ActionSchema = {
  type: 'resource',
  isDetail: true,
  label: 'Archive',
  icon: 'Archive',
  resource: {endpoint: {method: 'post', actionName: 'archive'}, data: {}},
};

const LINK_ACTION: ActionSchema = {
  type: 'link',
  isDetail: false,
  label: 'Documentation',
  icon: 'OpenInNew',
  link: {url: 'https://docs.habarico.com/node', target: 'blank'},
};

const SAVE_ACTION: ActionSchema = {type: 'save', isDetail: true, label: 'Save', save: {data: {}}};

const EXPORT_ACTION: ActionSchema = {
  type: 'export',
  isDetail: false,
  label: 'Export',
  icon: 'GetApp',
  export: {format: 'csv'},
};

const CONFIRMED_ACTION: ActionSchema = {
  ...RESOURCE_ACTION,
  confirmDialog: {title: 'Archive this product?', message: 'It disappears from the shop.'},
};

/** The export button reads the current filters and selection off the list context. */
const InList = ({children}: {children: React.ReactNode}) => {
  const listContext = useList<HabRecord>({data: RECORDS, resource: PRODUCTS_RESOURCE});
  return <ListContextProvider value={listContext}>{children}</ListContextProvider>;
};

/**
 * **One action schema in, one button out** — the single-action renderer every action slot in the
 * layer is ultimately built from (`SchemaButtons` is a row of these).
 *
 * It renders no button of its own. It turns the schema into presentation props — label (run through
 * `useStrTemplate`, so a label may interpolate the record), icon, colour, confirmation dialog,
 * surface — and hands them to the **button provider**, which picks the concrete component by
 * `schema.type`:
 *
 * | `schema.type`    | Component                   |
 * |------------------|-----------------------------|
 * | `view`           | `SchemaViewButton` (and through it the create / edit / show variants) |
 * | `resource`       | `ResourceButton` — calls the endpoint and stays on the page |
 * | `link`           | `LinkButton` |
 * | `save`           | `SaveButton` |
 * | `export`         | `ExportButton` |
 * | `upload-files`   | `SchemaUploadFilesButton` |
 *
 * Two consequences worth knowing:
 *
 * - **A `view` action with no resolvable view schema renders nothing.** The provider needs the
 *   *global* view schema of the target resource to know what the button opens; without it the whole
 *   button is dropped, silently.
 * - **The icon is only ever the schema's.** When `schema.icon` is unset the prop stays unset, so the
 *   concrete button applies its own default — a view button derives one from the target view type.
 *   Materialising a fallback here would shadow all of them.
 *
 * The rendered button is wrapped in an `ActionSchemaProvider`, which is how anything underneath
 * (a confirmation dialog, a post-action) reads the action it belongs to.
 *
 * These stories mount a **form** shell, because one of the concrete buttons needs one: `SaveButton`
 * guards itself with `useFormContext` and renders nothing outside a form (it would otherwise crash
 * on a show view, where it has nothing to save).
 */
const meta = {
  title: 'schema/buttons/SchemaButton',
  component: SchemaButton,
  tags: ['autodocs'],
  parameters: {layout: 'padded', controls: {disable: true}},
  decorators: [withSchemaInputShell],
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The dispatch matrix — the same component, one action type per row. */
export const ActionTypes: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButton — dispatch by schema.type'}>
      <Showcase caption={"'view' → SchemaViewButton, opens the target view"}>
        <SchemaButton schema={VIEW_ACTION} />
      </Showcase>
      <Showcase caption={"'resource' → ResourceButton, calls the endpoint in place"}>
        <SchemaButton schema={RESOURCE_ACTION} />
      </Showcase>
      <Showcase caption={"'link' → LinkButton, an ordinary href"}>
        <SchemaButton schema={LINK_ACTION} />
      </Showcase>
      <Showcase caption={"'save' → SaveButton, submits the form this shell mounts"}>
        <SchemaButton schema={SAVE_ACTION} />
      </Showcase>
      <Showcase caption={"'export' → ExportButton, needs a list context"}>
        <InList>
          <SchemaButton schema={EXPORT_ACTION} />
        </InList>
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `surface` decides the shape, not the behaviour. `button` is the default; `iconButton` is what a
 * datagrid row asks for; `menuItem` is what an `OverflowToolbar` flips a button to when it collapses
 * into the `⋮` menu — `isMenu` forces that surface regardless of what `surface` says.
 */
export const Surfaces: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButton — surfaces'}>
      <Showcase caption={"surface: 'button' (default)"}>
        <SchemaButton schema={VIEW_ACTION} />
      </Showcase>
      <Showcase caption={"surface: 'iconButton' — the datagrid row form"}>
        <SchemaButton schema={VIEW_ACTION} surface={'iconButton'} />
      </Showcase>
      <Showcase caption={'isMenu — the overflow-menu form, whatever `surface` says'}>
        <SchemaButton schema={VIEW_ACTION} isMenu />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `schema.confirmDialog` turns any action into a confirmed one — the dialog comes from the schema,
 * not from the call site, so a destructive backend action guards itself wherever it is rendered.
 * Click Archive to see it.
 */
export const Confirmation: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButton — confirmDialog'}>
      <Showcase caption={'no confirmDialog — fires immediately'}>
        <SchemaButton schema={RESOURCE_ACTION} />
      </Showcase>
      <Showcase caption={'confirmDialog set — asks first'}>
        <SchemaButton schema={CONFIRMED_ACTION} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * `schema.color` and `showLabel`. The colour defaults to `inherit` when the schema does not name
 * one; `showLabel={false}` keeps the icon and drops the text, which is how a dense toolbar is built
 * without changing the surface.
 */
export const LabelAndColor: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButton — label and colour'}>
      <Showcase caption={'schema.color unset → inherit'}>
        <SchemaButton schema={RESOURCE_ACTION} variant={'contained'} />
      </Showcase>
      <Showcase caption={"schema.color: 'error'"}>
        <SchemaButton schema={{...RESOURCE_ACTION, color: 'error'}} variant={'contained'} />
      </Showcase>
      <Showcase caption={'showLabel={false} — icon only, same surface'}>
        <SchemaButton schema={RESOURCE_ACTION} showLabel={false} />
      </Showcase>
    </ShowcaseStack>
  ),
};

/**
 * A `view` action whose target view does not exist on the resource. The provider has no view schema
 * to build the button from, so **nothing renders** — no button, no error. The same silent drop a
 * descriptor gets when its name does not resolve (see `schema/boxes/BoxActions`).
 */
export const UnresolvableView: Story = {
  render: () => (
    <ShowcaseStack title={'SchemaButton — an unresolvable view'}>
      <Showcase caption={"view: 'show' — a real product view, renders"}>
        <SchemaButton schema={VIEW_ACTION} />
      </Showcase>
      <Showcase caption={"view: 'preview' — not in the schema, renders nothing"}>
        <SchemaButton schema={{...VIEW_ACTION, view: redirectView('preview')}} />
      </Showcase>
    </ShowcaseStack>
  ),
};
