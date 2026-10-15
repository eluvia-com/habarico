import React from 'react';
import {SortPayload, useListContext, useRemoveFromStore, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';

export type ResetConfigurableDatagridButtonProps = {
  preferenceKey: string;
  filterDefaultValues: object;
  sort: SortPayload;
} & ActionButtonProps;

export const ResetConfigurableDatagridButton = ({
  preferenceKey,
  filterDefaultValues,
  sort,
  surface = 'iconButton',
  size = 'medium',
  ...rest
}: ResetConfigurableDatagridButtonProps) => {
  const resetStore = useRemoveFromStore();
  const {setFilters, setSort} = useListContext();
  const translate = useTranslate();

  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    resetStore(`preferences.${preferenceKey}.columns`);
    resetStore(`preferences.${preferenceKey}.availableColumns`);
    resetStore(`preferences.${preferenceKey}.columnWidths`);
    setFilters(filterDefaultValues, {});
    setSort(sort);
  };

  return (
    <ActionButton
      {...rest}
      surface={surface}
      size={size}
      onClick={handleClick}
      confirm={{
        title: 'ra.action.reset_datagrid_settings_confirm',
        content: 'ra.message.reset_datagrid_settings_confirm',
      }}
      icon={<Icon icon={IconType.PlaylistRemove} />}
      label={translate('ra.action.reset_datagrid_settings')}
    />
  );
};
