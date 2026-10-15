import React from 'react';
import {ButtonProps, IconButtonWithTooltip} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';

export const SchemaRemoveItemButton = (props: ButtonProps) => {
  return (
    <IconButtonWithTooltip label="ra.action.remove" size="small" color="warning" {...props}>
      <Icon icon={IconType.RemoveCircle} />
    </IconButtonWithTooltip>
  );
};
