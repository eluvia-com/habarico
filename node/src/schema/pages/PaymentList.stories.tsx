import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PAYMENTS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';
import {PAGE_STORY_PARAMETERS} from './_storyParameters';

/**
 * Schema-driven payment **list**, generated entirely from the mock schema: the `SchemaList` view
 * reads the resource's `list` view schema (variable symbol / property relation / CZK amount /
 * coloured direction & status chips / due date columns, search + status + direction filters) and
 * renders the admin `ListShell` + datagrid. Landing route: `/estates/payments`.
 *
 * The last column is a **field action** — the frontend half of python's `FieldAction`: a field
 * descriptor carrying an `action` instead of a value, so `SchemaFieldOrInput` hands it to
 * `SchemaActionField` and the cell renders a button. Here it triggers the `mark_paid` resource
 * action (a PATCH on the record, confirmed by a dialog); inside a datagrid the button collapses to
 * icon-only, because the collection sets `isInCollection` on the value-location context.
 *
 * `options.dynamicRender.showQuery` (`show_query` on the python descriptor) hides the button on
 * rows already settled or cancelled, and the mock provider really writes the change, so clicking
 * it flips the status chip to Uhrazeno and the button disappears from that row on the refresh
 * that follows. The condition names the accented `"Stornováno"` status directly —
 * `createConditionFunction` parses expressions into an AST, so string literals are not limited
 * to ASCII (HAB-901).
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PaymentList',
  parameters: {...PAGE_STORY_PARAMETERS},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PAYMENTS_RESOURCE}`} />,
};
