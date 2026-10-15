import React from 'react';
import {useTranslate} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {Badge, Box} from '@mui/material';

type DatagridRowTooltipProps = {
  singleLabel?: string;
  doubleLabel?: string;
};

const clickIconSx = {fontSize: 16, color: 'inherit'} as const;

export const DatagridRowTooltip = ({singleLabel, doubleLabel}: DatagridRowTooltipProps) => {
  const translate = useTranslate();
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        columnGap: 1,
        rowGap: 1.25,
        alignItems: 'center',
        paddingTop: '3px',
      }}
    >
      {singleLabel && (
        <>
          <Icon
            icon={IconType.AdsClick}
            sx={clickIconSx}
            aria-label={translate('ra.list.row_click', {label: singleLabel})}
          />
          <span>-</span>
          <strong>{singleLabel}</strong>
        </>
      )}
      {doubleLabel && (
        <>
          <Badge
            badgeContent="2x"
            color="primary"
            overlap="circular"
            sx={{'& .MuiBadge-badge': {fontSize: 9, height: 14, minWidth: 14, padding: '0 3px'}}}
          >
            <Icon
              icon={IconType.AdsClick}
              sx={clickIconSx}
              aria-label={translate('ra.list.row_doubleclick', {label: doubleLabel})}
            />
          </Badge>
          <span>-</span>
          <strong>{doubleLabel}</strong>
        </>
      )}
    </Box>
  );
};
