import React from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {PAYMENTS_RESOURCE} from './_data';
import {SchemaStoryShell} from './_shell';

/**
 * Schema-driven payment **detail** (show), generated from the mock schema: the `SchemaShow` view
 * reads the resource's `show` view schema and renders two half-width cards — "Platba" (variable
 * symbol / property / owner / amount / direction) and "Úhrada" (status / method / dates) — plus a
 * full-width note card, inside the admin `ShowShell`. Landing route: `/estates/payments/4/show`,
 * reached from the list through the row's eye button or a row click.
 *
 * The "Úhrada" card ends with a **field action**: a field descriptor carrying an `action` instead of
 * a value, which `SchemaPropertyItem` renders through `SchemaActionField` so the row's value slot
 * holds a button. It triggers the same `mark_paid` resource action the payment list offers as its
 * last column, and the pairing is the point — one action, two renderings. A datagrid cell sets
 * `isInCollection`, which forces `showLabel: false` and collapses the button to a bare icon under a
 * "Uhradit" column header; here nothing does, so the button keeps its label and the descriptor is
 * left label-less instead (the row label would otherwise print "Uhradit" twice).
 *
 * Clicking it confirms, PATCHes the record and refreshes: the status flips to Uhrazeno, `paid_on`
 * fills in, and the button's condition then hides it.
 *
 * The header toolbar stays empty on purpose: neither payment action sets `showInDetail`, so the
 * field button is the detail's only trigger.
 */
const meta: Meta<typeof SchemaStoryShell> = {
  title: 'schema/pages/PaymentDetail',
  parameters: {layout: 'fullscreen'},
};

export default meta;

type Story = StoryObj<typeof SchemaStoryShell>;

/** Payment 4 — "Čeká na úhradu", so the `mark_paid` button is offered. */
export const Default: Story = {
  render: () => <SchemaStoryShell initialEntry={`/${PAYMENTS_RESOURCE}/4/show`} />,
};
