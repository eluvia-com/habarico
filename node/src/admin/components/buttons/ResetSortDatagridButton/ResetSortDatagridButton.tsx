import React from 'react';
import {SortPayload, useListContext, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';

export type ResetSortDatagridButtonProps = {
  sort: SortPayload;
} & ActionButtonProps;

export const ResetSortDatagridButton = ({
  sort,
  surface = 'iconButton',
  size = 'medium',
  ...rest
}: ResetSortDatagridButtonProps) => {
  const {setSort} = useListContext();
  const translate = useTranslate();
  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    setSort(sort);
  };

  return (
    <ActionButton
      {...rest}
      surface={surface}
      size={size}
      onClick={handleClick}
      icon={<Icon icon={IconType.SortByAlpha} />}
      label={translate('ra.action.reset_datagrid_sort')}
    />
  );
};
