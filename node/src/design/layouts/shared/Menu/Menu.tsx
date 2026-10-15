import React from 'react';
import {Box} from '@mui/material';
import {MenuComponentProps} from '../../types';
import {MenuListCollapsed} from './MenuListCollapsed';
import {MenuListFull} from './MenuListFull';

export const Menu = ({items, collapsed, onItemClick}: MenuComponentProps) => {
  return (
    <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column">
      {collapsed ? (
        <MenuListCollapsed items={items} level={0} onItemClick={onItemClick} />
      ) : (
        <MenuListFull items={items} level={0} onItemClick={onItemClick} />
      )}
    </Box>
  );
};
