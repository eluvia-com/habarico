import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {
  Form,
  AdminContext as RaAdminContext,
  ArrayInput as RaArrayInput,
  ResourceContextProvider,
} from 'react-admin';
import {useFormContext, useWatch} from 'react-hook-form';
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

// `SchemaInput` is what every checklist row cell renders through — a spy on it is a proxy for
// "did this row actually re-render", the same way `FormTableRow`'s own `React.memo` prevents its
// render body (and therefore every `column.render(...)` call, `SchemaInput` included) from running
// again when its props are unchanged. Mocked in its own file (not the main
// `SchemaChoicesFormIterator.test.tsx`) since `vi.mock` is file-wide and that suite renders real
// inputs deliberately.
const schemaInputRenders = vi.fn();

vi.mock('@schema/components/inputs/SchemaInput', () => ({
  SchemaInput: (props: {source?: string}) => {
    schemaInputRenders(props.source);
    return <input aria-label={props.source} readOnly />;
  },
}));

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

const UnrelatedTextInput = () => {
  const {register} = useFormContext();
  return <input aria-label={'unrelated'} {...register('unrelated')} />;
};

// Stands in for the effect an unscoped `dynamicRender` watch (or any other whole-form subscriber)
// elsewhere in the form has on every descendant: it has no memo of its own, so it re-renders on
// every field change — and, crucially, *constructs fresh JSX for its children on each render*
// rather than receiving them as an untouched `children` prop, the same way a schema-driven box
// tree is rebuilt from `React.createElement` on every render pass. That's what actually cascades
// the re-render down to `SchemaChoicesFormIterator`; passing `children` through unchanged would let
// React bail out of reconciling below this component on reference equality alone, which would
// pass this test regardless of whether the fix below works.
const FormBody = () => {
  useWatch();
  return (
    <>
      <UnrelatedTextInput />
      <RaArrayInput source={'equipment'} label={false} defaultValue={[]}>
        <MethodSchemaContext.Provider value={METHOD_SCHEMA}>
          <ViewSchemaContext.Provider
            value={{viewSchema: VIEW_SCHEMA, methodSchema: METHOD_SCHEMA, resource: 'properties'}}
          >
            <SchemaRootContext.Provider value={SCHEMA_ROOT}>
              <SchemaChoicesFormIterator schema={BOX_SCHEMA} source={'equipment'} inline />
            </SchemaRootContext.Provider>
          </ViewSchemaContext.Provider>
        </MethodSchemaContext.Provider>
      </RaArrayInput>
    </>
  );
};

const setup = (equipment: {equipment_type: string; note?: string}[]) => {
  render(
    <RaAdminContext i18nProvider={i18nProvider}>
      <ThemeProvider>
        <ResourceContextProvider value={'properties'}>
          <Form record={{id: 1, equipment, unrelated: ''}} onSubmit={() => undefined}>
            <FormBody />
          </Form>
        </ResourceContextProvider>
      </ThemeProvider>
    </RaAdminContext>
  );
};

// The regression the memoization in `SchemaChoicesFormIterator` (HAB-975) fixes: a checklist with
// several rows re-rendered every row's cells on any keystroke anywhere in the form. `rows` and
// `columns` are now memoized, so a row only re-renders `FormTableRow`'s `React.memo` bail applies
// when they're unchanged — a keystroke into a field the checklist doesn't read must not touch it.
// jsdom has no layout, so every box measures 0 — and a `FormTable` row with no box to measure hides
// its content rather than guess whether its cells fit side by side. Give the rows a wide box so
// these tests see a laid-out, inline checklist.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1024, 40)
  );
});

afterEach(() => vi.restoreAllMocks());

describe('SchemaChoicesFormIterator — row memoization', () => {
  it('does not re-render checklist rows when an unrelated field changes', async () => {
    const user = userEvent.setup();
    setup([{equipment_type: 'Aircon'}]);
    expect(schemaInputRenders).toHaveBeenCalled();
    schemaInputRenders.mockClear();

    await user.type(screen.getByLabelText('unrelated'), 'x');

    expect(schemaInputRenders).not.toHaveBeenCalled();
  });
});
