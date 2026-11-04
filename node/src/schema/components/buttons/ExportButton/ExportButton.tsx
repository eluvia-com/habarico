import React, {useCallback, useContext, useState} from 'react';
import {ListContext, useNotify} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {Icon} from '@design/atoms/Icon';
import {useParentResourceDescriptorsContext} from '@schema/contexts/ParentResourceDescriptorsContext/useParentResourceDescriptorsContext';
import {useExporter} from '@schema/hooks/useExporter';
import {ExportParams} from '@schema/providers/types';

export type ExportButtonProps = {
  format?: string;
  fields?: string[];
} & ActionButtonProps;

// Inside the list of its resource it exports the selected records (ids) or everything matching the
// current filters and sort. Anywhere else — a box header, a detail — there is no table state to read,
// so it exports every record of its resource that belongs to the parent record, if it is linked to
// one. `format`/`fields` come from the export action schema.
export const ExportButton = ({
  format = 'csv',
  fields,
  icon = <Icon icon={'GetApp'} />,
  label = 'ra.action.export',
  ...rest
}: ExportButtonProps) => {
  const resource = useResourceContext();
  const listContext = useContext(ListContext);
  const list = listContext?.resource === resource ? listContext : undefined;
  // the innermost record this one links back to — the one a linked action put on the stack
  const parent = useParentResourceDescriptorsContext().findLast((descriptor) => descriptor.target);
  const [isLoading, setIsLoading] = useState(false);
  const exporter = useExporter(resource);
  const notify = useNotify();

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ExportParams = {format, fields};
      if (!list) {
        params.filter = parent?.target ? {[parent.target]: parent.recordId} : {};
      } else if (list.selectedIds?.length > 0) {
        params.ids = list.selectedIds;
      } else {
        params.filter = list.filter ? {...list.filterValues, ...list.filter} : list.filterValues;
        params.sort = list.sort;
      }
      await exporter(params);
    } catch (error) {
      console.error(error);
      notify('ra.notification.http_error', {type: 'error'});
    } finally {
      setIsLoading(false);
    }
  }, [exporter, fields, format, list, notify, parent]);

  return (
    <ActionButton onClick={handleClick} loading={isLoading} icon={icon} label={label} {...rest} />
  );
};
