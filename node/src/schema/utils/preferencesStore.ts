import {BackendApi} from '@admin/utils/createBackendStore';
import {SchemaProvider} from '@schema/providers/types';
import {ServiceConfigMap} from '@typing';

// Whitelist of local-store keys that get mirrored to the backend verbatim.
// Anything not listed (e.g. `*.listParams`, `*.availableColumns`, `*.omit`,
// `preferences.layout.filtersCollapsed`) stays local only.
//
// This is the default of `SchemaAdmin`'s `preferencesWhitelist` prop — spread it to add keys of
// your own. A package that owns a preference adds its key that way rather than here:
// `habarico-enterprise` contributes `preferences.dashboard` for the paid dashboard's layout.
export const PREFERENCES_WHITELIST: string[] = [
  'theme',
  'locale',
  'preferences.layout.app.*',
  'preferences.**.columns',
  'preferences.**.columnWidths',
  '**.savedQueries',
];

export const resolvePreferencesServiceUrl = (
  serviceConfigMap: ServiceConfigMap
): string | undefined => {
  const matches = Object.entries(serviceConfigMap).filter(
    ([, config]) => config.syncPreferences === true
  );
  if (matches.length === 0) {
    return undefined;
  }
  if (matches.length > 1) {
    console.warn(
      `[Habarico] Multiple services have syncPreferences=true (${matches
        .map(([name]) => name)
        .join(', ')}); using "${matches[0][0]}". Mark only one service as the preferences service.`
    );
  }
  return matches[0][1].url;
};

export const buildPreferencesApi = (
  schemaProvider: SchemaProvider,
  serviceUrl: string
): BackendApi | undefined => {
  if (
    !schemaProvider.listPreferences ||
    !schemaProvider.setPreference ||
    !schemaProvider.deletePreference ||
    !schemaProvider.deleteAllPreferences
  ) {
    return undefined;
  }
  const {listPreferences, setPreference, deletePreference, deleteAllPreferences} = schemaProvider;
  return {
    list: () => listPreferences(serviceUrl),
    put: (key, value) => setPreference(serviceUrl, key, value),
    delete: (key) => deletePreference(serviceUrl, key),
    deleteAll: () => deleteAllPreferences(serviceUrl),
  };
};
