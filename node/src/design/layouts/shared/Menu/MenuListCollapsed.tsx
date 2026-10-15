import React from 'react';
import {Box, ListItem} from '@mui/material';
import {LayoutMenuItem} from '../../types';
import {MenuItem} from './MenuItem';
import {MenuItemWithPopper} from './MenuItemWithPopper';
import {useActiveExpanded} from './useActiveExpanded';

export type MenuListProps = {
  items: LayoutMenuItem[];
  level: number;
  onItemClick?: (item: LayoutMenuItem) => void;
};

export const MenuListCollapsed = ({items, level, onItemClick}: MenuListProps) => {
  const {isActive, isExpanded} = useActiveExpanded();

  return (
    <Box
      component="ul"
      gap={0.5}
      display="flex"
      flexDirection="column"
      sx={{
        m: 0,
        p: 0,
      }}
    >
      {items.map((item, index) => {
        return (
          <ListItem key={index} disableGutters disablePadding sx={{display: 'block'}}>
            {item.items ? (
              <MenuItemWithPopper
                item={item}
                active={isActive(item) || isExpanded(item)}
                collapsed={level === 0}
                dropdown={level >= 1}
              >
                <MenuListCollapsed items={item.items} level={level + 1} onItemClick={onItemClick} />
              </MenuItemWithPopper>
            ) : (
              <MenuItem
                item={item}
                active={isActive(item)}
                collapsed={level === 0}
                dropdown={level >= 1}
                tooltip={level === 0 ? item.title : undefined}
                onClick={() => {
                  onItemClick?.(item);
                }}
              />
            )}
          </ListItem>
        );
      })}
    </Box>
  );
};
