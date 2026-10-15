import React from 'react';
import {useRemoveFromStore, useTranslate} from 'react-admin';
import {ActionButton, ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {Icon, IconType} from '@design/atoms/Icon';

export type ResetColumnsWidthDatagridButtonProps = {
  preferenceKey: string;
} & ActionButtonProps;

export const ResetColumnsWidthDatagridButton = ({
  preferenceKey,
  surface = 'iconButton',
  size = 'medium',
  ...rest
}: ResetColumnsWidthDatagridButtonProps) => {
  const resetStore = useRemoveFromStore();
  const translate = useTranslate();

  const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    resetStore(`preferences.${preferenceKey}.columnWidths`);
  };

  return (
    <ActionButton
      {...rest}
      surface={surface}
      size={size}
      onClick={handleClick}
      icon={<Icon icon={IconType.HorizontalAlignCenter} />}
      label={translate('ra.action.reset_datagrid_columns')}
    />
  );
};
