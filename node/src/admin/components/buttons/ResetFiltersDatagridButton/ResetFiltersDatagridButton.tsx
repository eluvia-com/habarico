import React from 'react';
import {useListContext, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';

export type ResetFiltersDatagridButtonProps = {
  filterDefaultValues: object;
} & ActionButtonProps;

export const ResetFiltersDatagridButton = ({
  filterDefaultValues,
  surface = 'iconButton',
  size = 'medium',
  ...rest
}: ResetFiltersDatagridButtonProps) => {
  const {setFilters} = useListContext();
  const translate = useTranslate();
  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    setFilters(filterDefaultValues, {});
  };

  return (
    <ActionButton
      {...rest}
      surface={surface}
      size={size}
      onClick={handleClick}
      icon={<Icon icon={IconType.FilterAltOff} />}
      label={translate('ra.action.reset_datagrid_filters')}
    />
  );
};
