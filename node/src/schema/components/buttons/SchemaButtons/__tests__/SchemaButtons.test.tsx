import polyglotI18nProvider from 'ra-i18n-polyglot';
import React from 'react';
import {CoreAdminContext} from 'react-admin';
import {describe, expect, it, vi} from 'vitest';
import {csMessages} from '@foundation/utils/locale/cs';
import {ActionDescriptor, ActionSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaButtons} from '../SchemaButtons';

const ACTION_NAMES = ['approve', 'archive', 'export'];

vi.mock('@schema/contexts/LocalResourceSchemaContext/useLocalResourceSchemaContext', () => ({
  useLocalResourceSchemaContext: () => ({
    schema: {actions: ACTION_NAMES.map((name) => ({name, label: name}))},
  }),
}));

vi.mock('@schema/hooks/useHabRecordContext', () => ({
  useHabRecordContext: () => undefined,
}));

// The action buttons themselves (and the API wiring behind them) are not under test — only the `⋮`
// trigger the overflow toolbar adds next to them.
vi.mock('../../SchemaButton', () => ({
  SchemaButton: ({schema}: {schema: ActionSchema}) => <button type="button">{schema.label}</button>,
}));

const descriptors: ActionDescriptor[] = ACTION_NAMES.map((name) => ({name}));

describe('SchemaButtons ⋮ more trigger', () => {
  // The trigger label comes from the locale catalog, so the test runs on `cs` and asserts the Czech
  // string — the presentational `OverflowToolbar` would otherwise fall back to an untranslated `More`.
  it('labels the overflow trigger with the translated "more actions" text', () => {
    const i18nProvider = polyglotI18nProvider(() => csMessages, 'cs', {allowMissing: true});

    render(
      <CoreAdminContext i18nProvider={i18nProvider}>
        <SchemaButtons descriptors={descriptors} maxVisibleButtons={1} />
      </CoreAdminContext>
    );

    expect(screen.getByRole('button', {name: 'Další akce'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'More'})).not.toBeInTheDocument();
  });
});
