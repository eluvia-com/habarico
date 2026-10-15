import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {
  Form,
  AdminContext as RaAdminContext,
  ArrayInput as RaArrayInput,
  ResourceContextProvider,
} from 'react-admin';
import {useWatch} from 'react-hook-form';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ThemeProvider} from '@design/theme';
import {enMessages} from '@foundation/utils/locale/en';
import {MethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import type {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {ViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {defaultFieldProvider} from '@schema/providers/defaultFieldProvider';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import type {BoxSchema, FieldSchema, MethodSchema, ViewSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SchemaChoicesFormIterator} from '../SchemaChoicesFormIterator';

// The `listed` array box: one fixed row per enum value, ticked when the record holds it, plus free
// rows for the values listed in `otherValues`. Only the providers this render path reads are stubbed
// onto `SchemaRootContext` — the same approach as the schema input tests.

const i18nProvider = polyglotI18nProvider(() => enMessages, 'en');

const EQUIPMENT_TYPES = ['Alarm', 'Aircon', 'Pool', 'Other'];

const EQUIPMENT_FIELD: FieldSchema = {
  name: 'equipment',
  type: 'array',
  label: 'Equipment',
  items: {
    type: 'object',
    properties: [
      {
        name: 'equipment_type',
        type: 'string',
        format: 'choices',
        label: 'Equipment',
        enum: EQUIPMENT_TYPES.map((value) => ({value, label: value})),
      },
      {name: 'note', type: 'string', label: 'Note'},
    ],
  },
};

const METHOD_SCHEMA: MethodSchema = {fields: [EQUIPMENT_FIELD]};

const VIEW_SCHEMA: ViewSchema = {
  name: 'edit',
  type: 'edit',
  isDetail: true,
  endpoint: {method: 'get'},
};

const BOX_SCHEMA: BoxSchema = {
  name: 'equipment',
  type: 'array',
  label: 'Equipment',
  readOnly: false,
  array: {
    target: 'equipment',
    inline: true,
    listed: {fieldName: 'equipment_type', otherValues: ['Other']},
  },
  // The columns come from these field descriptors — a box without them renders no cells.
  boxes: [
    {type: 'field', name: 'equipment_type'},
    {type: 'field', name: 'note'},
  ],
};

const SCHEMA_ROOT = {
  defaultInputProvider,
  defaultFieldProvider,
  defaultValidatorProvider,
} as unknown as SchemaRootContextState;

const FormValues = () => {
  const equipment = useWatch({name: 'equipment'});
  return <output data-testid={'values'}>{JSON.stringify(equipment)}</output>;
};

const setup = (equipment: {equipment_type: string; note?: string}[]) => {
  render(
    <RaAdminContext i18nProvider={i18nProvider}>
      <ThemeProvider>
        <ResourceContextProvider value={'properties'}>
          <Form record={{id: 1, equipment}} onSubmit={() => undefined}>
            <RaArrayInput source={'equipment'} label={false} defaultValue={[]}>
              <MethodSchemaContext.Provider value={METHOD_SCHEMA}>
                <ViewSchemaContext.Provider
                  value={{
                    viewSchema: VIEW_SCHEMA,
                    methodSchema: METHOD_SCHEMA,
                    resource: 'properties',
                  }}
                >
                  <SchemaRootContext.Provider value={SCHEMA_ROOT}>
                    <SchemaChoicesFormIterator schema={BOX_SCHEMA} source={'equipment'} inline />
                  </SchemaRootContext.Provider>
                </ViewSchemaContext.Provider>
              </MethodSchemaContext.Provider>
            </RaArrayInput>
            <FormValues />
          </Form>
        </ResourceContextProvider>
      </ThemeProvider>
    </RaAdminContext>
  );
  return () => JSON.parse(screen.getByTestId('values').textContent || 'null');
};

/**
 * The row card a given cell sits in — the element carrying the row click. Clicking it directly is
 * the "dead surface" gesture: the card's own padding and the gaps between its cells, everything a
 * live control inside the row does not claim for itself.
 */
const rowOf = (cell: HTMLElement) => cell.closest('.MuiStack-root > div') as HTMLElement;

// jsdom has no layout, so every box measures 0 — and a `FormTable` row with no box to measure hides
// its content rather than guess whether its cells fit side by side. Give the rows a wide box so
// these tests see a laid-out, inline checklist.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1024, 40)
  );
});

afterEach(() => vi.restoreAllMocks());

describe('SchemaChoicesFormIterator', () => {
  it('renders a row per enum value except the `otherValues`, ticked where the record holds it', () => {
    setup([{equipment_type: 'Aircon'}]);

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3); // Alarm / Aircon / Pool — 'Other' is a free row, not a choice
    expect(boxes[0]).not.toBeChecked();
    expect(boxes[1]).toBeChecked();
    expect(boxes[2]).not.toBeChecked();
  });

  it('appends only the item fields when a choice is ticked, without the row bookkeeping', async () => {
    const user = userEvent.setup();
    const values = setup([]);

    await user.click(screen.getAllByRole('checkbox')[0]);

    // No `id` / `_isGenerated` / `_isChoiceRow` / `_index` / `_itemId`: those describe the rendered
    // row, and used to be saved with the record.
    expect(values()).toEqual([{equipment_type: 'Alarm', note: null}]);
  });

  it('drops the item again when the choice is unticked', async () => {
    const user = userEvent.setup();
    const values = setup([{equipment_type: 'Alarm'}, {equipment_type: 'Pool'}]);

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(values()).toEqual([{equipment_type: 'Pool'}]);
  });

  it('counts the items the record holds, not the checklist rows', () => {
    setup([{equipment_type: 'Aircon'}]);

    // Three checklist rows are on screen, one of them ticked.
    expect(screen.getByText('1 items')).toBeInTheDocument();
  });

  it('ticks a choice when its row is clicked', async () => {
    const user = userEvent.setup();
    const values = setup([]);

    await user.click(rowOf(screen.getAllByRole('checkbox')[0]));

    expect(values()).toEqual([{equipment_type: 'Alarm', note: null}]);
  });

  it('unticks a choice when its ticked row is clicked', async () => {
    const user = userEvent.setup();
    const values = setup([{equipment_type: 'Alarm'}, {equipment_type: 'Pool'}]);

    await user.click(rowOf(screen.getAllByRole('checkbox')[0]));

    expect(values()).toEqual([{equipment_type: 'Pool'}]);
  });

  it('leaves a live cell input its own click, so editing a ticked row cannot untick it', async () => {
    const user = userEvent.setup();
    const values = setup([{equipment_type: 'Alarm'}]);

    await user.click(screen.getAllByLabelText('Note')[0]);

    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    expect(values()).toEqual([{equipment_type: 'Alarm'}]);
  });

  it('does nothing when a free row is clicked — it has no choice to toggle', async () => {
    const user = userEvent.setup();
    const values = setup([{equipment_type: 'Other', note: 'Cellar'}]);

    await user.click(rowOf(screen.getAllByLabelText('Remove')[3]));

    expect(values()).toEqual([{equipment_type: 'Other', note: 'Cellar'}]);
  });

  it('offers the delete action on the free rows only, never on a choice row', () => {
    setup([{equipment_type: 'Aircon'}, {equipment_type: 'Other', note: 'Cellar'}]);

    const [alarm, aircon, pool, other] = screen.getAllByLabelText('Remove');
    // Ticked or not, a choice row is removed by unticking it — a delete button beside the checkbox
    // would either duplicate it or (on an unticked row) have nothing to delete.
    for (const row of [alarm, aircon, pool]) {
      expect(row).toBeDisabled();
      expect(row).toHaveStyle({visibility: 'hidden'});
    }
    // A free row has no checkbox of its own, so deleting it is the only way to drop it.
    expect(other).toBeEnabled();
  });
});
