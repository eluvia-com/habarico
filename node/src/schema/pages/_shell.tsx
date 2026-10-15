import React, {useState} from 'react';
import {TestMemoryRouter} from 'react-admin';
import {HabaricoLogo} from '@design/atoms/HabaricoLogo';
import {SchemaAdmin} from '@schema/components/base/SchemaAdmin';
import {ServiceConfigMap} from '@typing';
import {
  LANGUAGES,
  SERVICE_NAME,
  SERVICE_URL,
  createMockDataProviderFactory,
  mockAuthProvider,
  mockSchemaProvider,
} from './_data';

/**
 * Story-support harness for the **schema-layer** page stories (HAB-687). It boots a real
 * `SchemaAdmin` — the schema-layer entry point — inside a memory router, wired to the mock
 * `schemaProviderFactory` / `dataProviderFactory` / `authProvider` from `_data`. The schema layer then
 * generates the entire admin UI (menu, list / show / edit / create / action views) from the
 * hand-authored mock schema, with no live backend.
 *
 * The schema-layer analogue of `admin/pages/_shell.tsx` (`AdminStoryShell`, which boots the real
 * `BaseAdmin`): one layer up, driven by a schema instead of explicit `<Resource>`/view components.
 * A story just points `initialEntry` at the route it wants to showcase — resources are generated
 * from the mock service schema, so no children are required.
 *
 * No dashboard is mounted: the library ships none, so this harness has nothing to put at `/`. Every
 * page is still reachable via its resource menu item; only the logo's way home leads nowhere here.
 */

const SERVICE_CONFIG_MAP: ServiceConfigMap = {[SERVICE_NAME]: {url: SERVICE_URL}};

export type SchemaStoryShellProps = {
  /** Router entry the story lands on (e.g. `/`, `/estates/properties`, `/estates/properties/1/show`). */
  initialEntry: string;
};

export const SchemaStoryShell = ({initialEntry}: SchemaStoryShellProps) => {
  // One data provider factory per mount → each story starts from clean, isolated data.
  const [dataProviderFactory] = useState(createMockDataProviderFactory);
  return (
    <TestMemoryRouter initialEntries={[initialEntry]}>
      <SchemaAdmin
        serviceConfigMap={SERVICE_CONFIG_MAP}
        schemaProviderFactory={() => mockSchemaProvider}
        dataProviderFactory={dataProviderFactory}
        authProvider={mockAuthProvider}
        availableLanguages={LANGUAGES}
        LogoComponent={HabaricoLogo}
        contentMaxWidth={false}
      >
        {null}
      </SchemaAdmin>
    </TestMemoryRouter>
  );
};
