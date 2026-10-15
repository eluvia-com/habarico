import {useCallback} from 'react';
import {useDataProvider, useNotify} from 'react-admin';
import {ExportParams, ServiceDataProvider} from '@schema/providers/types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Runs a backend export (GET <resource>/export/) and downloads the returned file.
// A 202 response means the export exceeded the sync threshold and runs in the
// background — the user is only notified for now (async export UI is HAB-633).
export const useExporter = (resource: string) => {
  const dataProvider = useDataProvider<ServiceDataProvider>();
  const notify = useNotify();

  return useCallback(
    async (params: ExportParams) => {
      const result = await dataProvider.export(resource, params);

      if (result.status === 202) {
        notify('ra.notification.export_running', {type: 'info'});
        return;
      }

      if (!result.blob) {
        return;
      }

      // replace '/' with '_' for a valid filename
      const fallbackFilename = `${resource.replace('/', '_')}.${params.format}`;
      downloadBlob(result.blob, result.filename ?? fallbackFilename);
    },
    [dataProvider, notify, resource]
  );
};
