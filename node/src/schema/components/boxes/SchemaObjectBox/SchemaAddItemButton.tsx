import React from 'react';
import {ButtonProps, IconButtonWithTooltip} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';

export const SchemaAddItemButton = (props: ButtonProps) => {
  return (
    <IconButtonWithTooltip label="ra.action.add" size="small" color="primary" {...props}>
      <Icon icon={IconType.AddCircle} />
    </IconButtonWithTooltip>
  );
};
