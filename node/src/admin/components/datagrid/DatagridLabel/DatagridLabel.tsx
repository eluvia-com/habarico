import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {Tooltip} from '@mui/material';

export type DatagridLabelProps = {
  label: string | React.ReactNode;
  shortLabel?: string | React.ReactNode;
};

export const DatagridLabel = ({label, shortLabel}: DatagridLabelProps) => {
  if (!shortLabel) return <DynamicText>{label}</DynamicText>;
  return (
    <Tooltip title={label} placement="right">
      <span>
        <DynamicText>{shortLabel}</DynamicText>
      </span>
    </Tooltip>
  );
};
