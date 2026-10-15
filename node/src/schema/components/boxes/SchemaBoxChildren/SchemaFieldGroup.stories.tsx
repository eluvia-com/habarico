import React, {useMemo} from 'react';
import {
  CoreAdminContext,
  Form,
  ResourceContextProvider,
  TestMemoryRouter,
  testDataProvider,
} from 'react-admin';
import {i18nProvider} from '@admin/pages/_i18n';
import {StoryAdminConfigProvider} from '@admin/pages/_storyConfig';
import {withRaDefaults} from '@admin/theme';
import {LocaleProvider} from '@design/theme';
import {Box, ThemeProvider, useTheme} from '@mui/material';
import {MethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import type {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {ViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {defaultFieldProvider} from '@schema/providers/defaultFieldProvider';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import type {FieldDescriptor, FieldSchema, MethodSchema, ViewSchema} from '@schema/types';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {SchemaFieldGroup} from './SchemaFieldGroup';

const RESOURCE = 'schema-field-group-demo';

// `area` shows only while `show_area` is on. The query reads `data.<field>`, which follows the live
// form values; `record.<field>` would only ever see the loaded record.
const FIELDS: FieldSchema[] = [
  {name: 'address', type: 'string', label: 'Address'},
  {name: 'show_area', type: 'boolean', label: 'Show the area field'},
  {
    name: 'area',
    type: 'number',
    label: 'Area',
    options: {dynamicRender: {showQuery: 'data.show_area == true'}},
  },
];

const FIELD_DESCRIPTORS: FieldDescriptor[] = FIELDS.map((field) => ({
  type: 'field',
  name: field.name,
}));

const METHOD_SCHEMA: MethodSchema = {fields: FIELDS};

const viewSchema = (readOnly: boolean): ViewSchema => ({
  name: readOnly ? 'show' : 'edit',
  // `useViewSchemaContext` derives `readOnly` from the view type.
  type: readOnly ? 'show' : 'edit',
  isDetail: true,
  endpoint: {method: 'get'},
});

// Only the providers this render path actually reads: inputs (`useGetInput`), the read-only field
// cell (`useGetField`) and schema validators — the same minimal stub `SchemaChoicesArrayBox`'s story
// uses. A full `SchemaRootContextProvider` would need a schema fetch, a data provider and a service
// config, none of which a single field group has any use for.
const SCHEMA_ROOT = {
  defaultInputProvider,
  defaultFieldProvider,
  defaultValidatorProvider,
} as unknown as SchemaRootContextState;

// No-op data provider — this group never fetches. Created once, shared across stories.
const dataProvider = testDataProvider();

/**
 * Re-applies the React Admin theme defaults on top of whatever theme the global Storybook decorator
 * supplies (`helperText: false` per input, etc.) — see `SchemaChoicesArrayBox`'s story for the full
 * rationale. A story that boots `CoreAdminContext` by hand is outside both entry points that would
 * otherwise apply these.
 */
const RaDefaultsThemeProvider = ({children}: {children: React.ReactNode}) => {
  const theme = useTheme();
  const raTheme = useMemo(() => withRaDefaults(theme), [theme]);
  return <ThemeProvider theme={raTheme}>{children}</ThemeProvider>;
};

type StoryArgs = {
  /** Read view — the same schema renders through `SchemaField` instead of `SchemaInput`. */
  readOnly: boolean;
  /** Seeds `show_area`, so the story can start with the conditional field already hidden. */
  showArea: boolean;
};

/**
 * Boots the minimal context `SchemaFieldGroup` needs — React Admin form + i18n + locale, the schema
 * layer's method / view schema contexts and the provider stub above, like `SchemaChoicesArrayBox`'s
 * story — plus a memory router: resolving the field's `showQuery` reaches into
 * `useSchemaViewRouterContext`, and that needs one.
 */
const FieldGroupStoryShell = ({readOnly, showArea}: StoryArgs) => {
  const view = viewSchema(readOnly);
  return (
    <TestMemoryRouter>
      <RaDefaultsThemeProvider>
        <CoreAdminContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
          <LocaleProvider>
            <StoryAdminConfigProvider>
              <SchemaRootContext.Provider value={SCHEMA_ROOT}>
                <ResourceContextProvider value={RESOURCE}>
                  <MethodSchemaContext.Provider value={METHOD_SCHEMA}>
                    <ViewSchemaContext.Provider
                      value={{viewSchema: view, methodSchema: METHOD_SCHEMA, resource: RESOURCE}}
                    >
                      <Form
                        record={{address: 'Jihlavská 521/62', show_area: showArea, area: 50}}
                        mode={'onChange'}
                        onSubmit={() => undefined}
                      >
                        <Box sx={{width: 420, p: 2, border: '1px dashed', borderColor: 'divider'}}>
                          <SchemaFieldGroup fields={FIELD_DESCRIPTORS} />
                        </Box>
                      </Form>
                    </ViewSchemaContext.Provider>
                  </MethodSchemaContext.Provider>
                </ResourceContextProvider>
              </SchemaRootContext.Provider>
            </StoryAdminConfigProvider>
          </LocaleProvider>
        </CoreAdminContext>
      </RaDefaultsThemeProvider>
    </TestMemoryRouter>
  );
};

/**
 * Lays a box's fields out as label + value rows: inputs in an edit view, values in a read view. A
 * field whose schema carries `options.dynamicRender.showQuery` shows only while the query holds —
 * its whole row, label included. Toggle "Show the area field" to show or hide "Area".
 */
const meta: Meta<StoryArgs> = {
  title: 'schema/boxes/SchemaFieldGroup',
  tags: ['autodocs'],
  parameters: {layout: 'centered'},
  argTypes: {
    readOnly: {control: 'boolean'},
    showArea: {control: 'boolean'},
  },
  args: {readOnly: false, showArea: true},
  render: (args) => <FieldGroupStoryShell {...args} />,
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Edit view — "Area" follows the "Show the area field" switch. */
export const ConditionalField: Story = {};

/** Read view — "Area" follows the record's `show_area`; set it with the `showArea` control. */
export const ConditionalFieldReadOnly: Story = {
  args: {readOnly: true},
};
