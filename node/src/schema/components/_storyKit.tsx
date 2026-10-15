/* eslint-disable react-refresh/only-export-components */
// Story-support harness for the schema-layer COMPONENT stories (HAB-878). NOT exported from the
// `@schema` barrel and never shipped in the library.
//
// Why it exists: a schema component is not configured by props but by **schema**, and it reads that
// schema out of a ring of contexts (`SchemaRootContext` → resource → record → local resource schema
// → method schema → view schema). Before this kit every schema story rebuilt that ring inline, each
// one a little differently and each one casting its own half-filled `SchemaRootContextState` through
// `as unknown as`. One shell, one typed root, so a story file contains only the schema fragment it
// is actually about.
//
// The layer analogue of `admin/components/{fields,inputs}/_storyKit.tsx`, one level up: those wrap a
// single React Admin widget in a form/record context, this one adds the schema ring on top. Like
// them, it boots `CoreAdminContext` rather than a real admin root — `SchemaAdmin` injects React
// Admin's own `ThemeProvider`, which would override the design theme the global Storybook decorator
// supplies and with it the light/dark toolbar toggle.
import React, {useMemo, useState} from 'react';
import {
  CoreAdminContext,
  Form,
  RecordContextProvider,
  ResourceContextProvider,
  TestMemoryRouter,
  memoryStore,
} from 'react-admin';
import {ListConfigProvider} from '@admin/contexts/ListConfigContext';
import {i18nProvider} from '@admin/pages/_i18n';
import {StoryAdminConfigProvider} from '@admin/pages/_storyConfig';
import {withRaDefaults} from '@admin/theme';
import {LocaleProvider} from '@design/theme';
import {TabsLocationProvider} from '@foundation/hooks/useTabsLocation';
import {Box, Divider, Stack, ThemeProvider, Typography, useTheme} from '@mui/material';
import {LocalResourceSchemaProvider} from '@schema/contexts/LocalResourceSchemaContext';
import {MethodSchemaContext} from '@schema/contexts/MethodSchemaContext/useMethodSchemaContext';
import type {SchemaRootContextState} from '@schema/contexts/SchemaRootContext/types';
import {SchemaRootContext} from '@schema/contexts/SchemaRootContext/useSchemaRootContext';
import {ViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {defaultBoxProvider} from '@schema/providers/defaultBoxProvider';
import {defaultButtonProvider} from '@schema/providers/defaultButtonProvider';
import {defaultFieldProvider} from '@schema/providers/defaultFieldProvider';
import {defaultInputProvider} from '@schema/providers/defaultInputProvider';
import {defaultValidatorProvider} from '@schema/providers/defaultValidatorProvider';
import {defaultViewProvider} from '@schema/providers/defaultViewProvider';
import type {LocalResourceSchema, MethodSchema, ViewSchema} from '@schema/types';
import type {Decorator} from '@storybook/react-vite';
import {
  PRODUCTS_RESOURCE,
  PRODUCT_METHOD,
  PRODUCT_RECORD,
  PRODUCT_RESOURCE_SCHEMA,
  PRODUCT_VIEWS,
  SERVICES_SCHEMA,
  SERVICE_CONFIG_MAP,
  createMockDataProvider,
  mockAuthProvider,
  mockSchemaProvider,
} from './_data';

// ----------------------------------------------------------------------------
// The schema root
// ----------------------------------------------------------------------------

/**
 * The `SchemaRootContext` value `SchemaAdmin` would normally assemble after its schema fetch —
 * built here directly so a component mounts without the admin shell. **Fully typed**: every story
 * gets the same complete root, instead of each casting its own partial stub through
 * `as unknown as SchemaRootContextState` and discovering at render time which field it forgot.
 *
 * The `default*Provider`s are the library's real ones, so what a story renders is the stock
 * dispatch — pass an override to demonstrate a custom provider.
 */
export const makeSchemaRoot = (
  overrides: Partial<SchemaRootContextState> = {}
): SchemaRootContextState => ({
  schemaProvider: mockSchemaProvider,
  dataProvider: createMockDataProvider(),
  authProvider: mockAuthProvider,
  servicesSchema: SERVICES_SCHEMA,
  refetchSchema: () => undefined,
  serviceConfigMap: SERVICE_CONFIG_MAP,
  resources: {},
  defaultRowAction: 'none',
  isLoaded: true,
  defaultFieldProvider,
  defaultInputProvider,
  defaultValidatorProvider,
  defaultBoxProvider,
  defaultButtonProvider,
  defaultViewProvider,
  hasDashboard: false,
  userIdentity: {id: 1, fullName: 'Alex Carter'},
  setUserIdentity: () => undefined,
  ...overrides,
});

const SHOW_VIEW = PRODUCT_VIEWS.find((view) => view.name === 'show') as ViewSchema;
const EDIT_VIEW = PRODUCT_VIEWS.find((view) => view.name === 'edit') as ViewSchema;

// ----------------------------------------------------------------------------
// Theme
// ----------------------------------------------------------------------------

/**
 * Re-applies the React Admin theme defaults on top of whatever theme the global Storybook decorator
 * supplies. `SchemaAdmin` / `BaseAdmin` do this for the real admin (`withRaDefaults`), and one of
 * those defaults is `helperText: false` per input — without it React Admin reserves a helper-text
 * row under every input whether or not one is set, so a story that boots `CoreAdminContext` by hand
 * shows spacing the library never renders. Wrapped (not replaced) so the light/dark toolbar toggle
 * still drives the theme.
 */
const RaDefaultsThemeProvider = ({children}: {children: React.ReactNode}) => {
  const theme = useTheme();
  const raTheme = useMemo(() => withRaDefaults(theme), [theme]);
  return <ThemeProvider theme={raTheme}>{children}</ThemeProvider>;
};

// ----------------------------------------------------------------------------
// The provider ring
// ----------------------------------------------------------------------------

export type SchemaStoryProvidersProps = {
  children: React.ReactNode;
  /** Resource the component renders under. */
  resource?: string;
  /** Ambient record (`useRecordContext`). Pass `null` for a story that has none. */
  record?: Record<string, unknown> | null;
  /** The resource schema the local-resource context serves, without a fetch. */
  schema?: LocalResourceSchema;
  /** Fields the view exposes (`useMethodSchemaContext`). */
  methodSchema?: MethodSchema;
  /** View the component believes it renders in — `readOnly` is derived from its type. */
  viewSchema?: ViewSchema;
  /** Wrap the children in a React Admin `Form` (write mode); the record seeds the form values. */
  form?: boolean;
  /** Overrides merged into the schema root (e.g. a custom `fieldProvider`). */
  root?: Partial<SchemaRootContextState>;
  /**
   * Mount the list-view config a datagrid slot needs. `DatagridActions` (and with it
   * `SchemaListActions`) reads `ListConfigContext` and throws without it — in the real admin the
   * list view supplies it, so a story for a *list* slot has to bring it too.
   */
  list?: boolean;
  /**
   * Store key the list config hands to the datagrid for its column preferences (widths, visibility).
   * The decorators default it to the story's own id; pass one explicitly only when a single story
   * mounts two *differently shaped* datagrids, which would otherwise hand each other a stored column
   * set built for different columns — and make the datagrid resize itself in a loop until React
   * gives up ("Maximum update depth exceeded"), a crash the `RenderErrorBoundary` swallows while the
   * story test still reports a pass.
   */
  preferenceKey?: string;
  /** Width of the bounded wrapper the component renders in; `false` for full width. */
  width?: number | false;
};

/**
 * Boots the whole schema context ring around one component, inside a bounded wrapper.
 *
 * Outermost → in: `TestMemoryRouter` (the view router reads `useNavigate` / `useSearchParams`) →
 * `CoreAdminContext` (data provider, i18n, store) → `LocaleProvider` → `StoryAdminConfigProvider` →
 * `TabsLocationProvider` → `SchemaRootContext` → `ResourceContextProvider` → `RecordContextProvider`
 * → `LocalResourceSchemaProvider` → `MethodSchemaContext` → `ViewSchemaContext` → optional `Form`.
 *
 * `TabsLocationProvider` is mounted by `ViewContent` in the real admin — one per view — and a tab
 * box throws without it. `syncWithLocation={false}`, the overlay setting: an isolated component
 * story keeps its tab state in memory rather than writing it into the story URL's hash.
 *
 * Every level has a working default, so the common case is `<SchemaStoryProviders>` with no props.
 */
export const SchemaStoryProviders = ({
  children,
  resource = PRODUCTS_RESOURCE,
  record = PRODUCT_RECORD,
  schema = PRODUCT_RESOURCE_SCHEMA,
  methodSchema = PRODUCT_METHOD,
  viewSchema,
  form = false,
  root,
  list = false,
  preferenceKey = 'story.list',
  width = 720,
}: SchemaStoryProvidersProps) => {
  // One data provider per mount → a story that writes starts from clean, isolated data.
  const [schemaRoot] = useState(() => makeSchemaRoot(root));
  // ...and one React Admin store per mount, which is **not** optional. `CoreAdminContext` falls back
  // to a module-level `memoryStore()` singleton shared by every instance on the page, and
  // `StoreContextProvider` calls `setup()` on mount / `teardown()` on unmount — both of which empty
  // it. On an autodocs page every story of the file mounts its own `CoreAdminContext`, so each mount
  // wiped what the already-mounted stories had written. The visible symptom was a datagrid rendering
  // *no columns at all*: `DatagridConfigurable` writes its column list to the store in an effect, and
  // once that entry is wiped the grid falls back to an empty column set (it comes back on the next
  // re-render, which is why poking the grid "fixed" it). A per-mount store isolates story
  // preferences the way a real admin isolates a user's.
  const [store] = useState(() => memoryStore());
  const view = viewSchema ?? (form ? EDIT_VIEW : SHOW_VIEW);

  const bounded = <Box sx={width === false ? undefined : {width, mx: 'auto'}}>{children}</Box>;
  const inner = list ? (
    <ListConfigProvider
      preferenceKey={preferenceKey}
      sort={{field: 'id', order: 'ASC'}}
      filterDefaultValues={{}}
      filters={[]}
    >
      {bounded}
    </ListConfigProvider>
  ) : (
    bounded
  );

  return (
    <RaDefaultsThemeProvider>
      <TestMemoryRouter initialEntries={['/']}>
        <CoreAdminContext
          dataProvider={schemaRoot.dataProvider}
          authProvider={schemaRoot.authProvider}
          i18nProvider={i18nProvider}
          store={store}
        >
          <LocaleProvider>
            <StoryAdminConfigProvider>
              <TabsLocationProvider syncWithLocation={false}>
                <SchemaRootContext.Provider value={schemaRoot}>
                  <ResourceContextProvider value={resource}>
                    <RecordContextProvider value={record ?? undefined}>
                      <LocalResourceSchemaProvider resource={resource} schema={schema}>
                        <MethodSchemaContext.Provider value={methodSchema}>
                          <ViewSchemaContext.Provider
                            value={{viewSchema: view, methodSchema, resource}}
                          >
                            {form ? (
                              <Form
                                record={record ?? undefined}
                                mode={'onChange'}
                                onSubmit={() => undefined}
                              >
                                {inner}
                              </Form>
                            ) : (
                              inner
                            )}
                          </ViewSchemaContext.Provider>
                        </MethodSchemaContext.Provider>
                      </LocalResourceSchemaProvider>
                    </RecordContextProvider>
                  </ResourceContextProvider>
                </SchemaRootContext.Provider>
              </TabsLocationProvider>
            </StoryAdminConfigProvider>
          </LocaleProvider>
        </CoreAdminContext>
      </TestMemoryRouter>
    </RaDefaultsThemeProvider>
  );
};

// ----------------------------------------------------------------------------
// Decorators — the three modes a schema component renders in
// ----------------------------------------------------------------------------

type ShellParameters = {
  list?: boolean;
  preferenceKey?: string;
  resource?: string;
  record?: Record<string, unknown> | null;
  schema?: LocalResourceSchema;
  methodSchema?: MethodSchema;
  viewSchema?: ViewSchema;
  root?: Partial<SchemaRootContextState>;
  width?: number | false;
};

const shellProps = (parameters: {schemaStory?: ShellParameters}) => parameters.schemaStory ?? {};

/**
 * Read mode — a field renders the ambient record. Override any level of the ring from the story's
 * `parameters.schemaStory` (`record`, `methodSchema`, `width`, …).
 */
export const withSchemaFieldShell: Decorator = (Story, {id, parameters}) => (
  <SchemaStoryProviders width={420} preferenceKey={`story.${id}`} {...shellProps(parameters)}>
    <Story />
  </SchemaStoryProviders>
);

/** Write mode — the same ring plus a React Admin `Form`, seeded from the ambient record. */
export const withSchemaInputShell: Decorator = (Story, {id, parameters}) => (
  <SchemaStoryProviders form width={600} preferenceKey={`story.${id}`} {...shellProps(parameters)}>
    <Story />
  </SchemaStoryProviders>
);

/**
 * Layout mode — wider, and in a form by default: most boxes render inputs, and the read-only ones
 * do not mind being inside one.
 */
export const withSchemaBoxShell: Decorator = (Story, {id, parameters}) => (
  <SchemaStoryProviders form width={860} preferenceKey={`story.${id}`} {...shellProps(parameters)}>
    <Story />
  </SchemaStoryProviders>
);

// ----------------------------------------------------------------------------
// Showcase helpers — for the matrix stories, which stack several configurations
// ----------------------------------------------------------------------------

/** One captioned entry in a stacked showcase. The caption says what the schema fragment below is. */
export const Showcase = ({caption, children}: {caption: string; children: React.ReactNode}) => (
  <Box>
    <Typography variant={'caption'} color={'text.secondary'} sx={{display: 'block', mb: 0.5}}>
      {caption}
    </Typography>
    {children}
  </Box>
);

/** A titled column of showcases — the shape every matrix story in this layer renders. */
export const ShowcaseStack = ({title, children}: {title?: string; children: React.ReactNode}) => (
  <Stack spacing={3} sx={{py: 2}}>
    {title ? (
      <Box>
        <Typography variant={'h6'}>{title}</Typography>
        <Divider sx={{mt: 0.5}} />
      </Box>
    ) : null}
    {children}
  </Stack>
);
