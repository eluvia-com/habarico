import React, {useCallback, useState} from 'react';
import {useListContext, useNotify} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon} from '@design/atoms/Icon';
import {useExporter} from '@schema/hooks/useExporter';
import {ExportParams} from '@schema/providers/types';

export type ExportButtonProps = {
  format?: string;
  fields?: string[];
} & ActionButtonProps;

// Exports either the selected records (ids) or everything matching the current
// list filters and sort; `format`/`fields` come from the export action schema
export const ExportButton = ({
  format = 'csv',
  fields,
  icon = <Icon icon={'GetApp'} />,
  label = 'ra.action.export',
  ...rest
}: ExportButtonProps) => {
  const {filter, filterValues, resource, sort, selectedIds} = useListContext();
  const [isLoading, setIsLoading] = useState(false);
  const exporter = useExporter(resource);
  const notify = useNotify();

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ExportParams = {format, fields};
      if (selectedIds && selectedIds.length > 0) {
        params.ids = selectedIds;
      } else {
        params.filter = filter ? {...filterValues, ...filter} : filterValues;
        params.sort = sort;
      }
      await exporter(params);
    } catch (error) {
      console.error(error);
      notify('ra.notification.http_error', {type: 'error'});
    } finally {
      setIsLoading(false);
    }
  }, [exporter, fields, filter, filterValues, format, notify, selectedIds, sort]);

  return (
    <ActionButton onClick={handleClick} loading={isLoading} icon={icon} label={label} {...rest} />
  );
};
