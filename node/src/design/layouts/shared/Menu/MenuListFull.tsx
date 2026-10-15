import React from 'react';
import {Box, Collapse, ListItem, useTheme} from '@mui/material';
import {varAlpha} from '../../../theme/utils';
import {LayoutMenuItem} from '../../types';
import {MenuItem} from './MenuItem';
import {useActiveExpanded} from './useActiveExpanded';

export type MenuListFullProps = {
  items: LayoutMenuItem[];
  level: number;
  onItemClick?: (item: LayoutMenuItem) => void;
};

// Sub-menu tree guide line.
const SUB_INDENT = 40; // left offset of a sub-item (px)
const ELBOW_WIDTH = 16; // horizontal reach of the connector; the rail sits this far left of the item
const ELBOW_RADIUS = 10;

export const MenuListFull = ({items, level, onItemClick}: MenuListFullProps) => {
  const {isActive, isExpanded} = useActiveExpanded();
  const theme = useTheme();
  const isSub = level >= 1;
  const lineColor = varAlpha(theme.palette.grey['500Channel'], 0.32);
  // Sub-items sit flush (gap 0), so a row is exactly the item height.
  const row = parseInt(String(theme.layout?.navItemHeight)) || 44;
  const half = row / 2;

  return (
    <Box
      component="ul"
      display="flex"
      flexDirection="column"
      sx={{
        m: 0,
        p: 0,
        // No gap between sub-items; the rail relies on rows being contiguous.
        gap: isSub ? 0 : 0.5,
        pl: isSub ? `${SUB_INDENT}px` : 0,
        position: isSub ? 'relative' : undefined,
      }}
    >
      {items.map((item, index) => {
        const active = isActive(item);
        // Parent of an open sub-menu: emphasise it without the active box.
        const highlighted = !active && !!item.items?.length && isExpanded(item);
        return (
          <ListItem
            key={index}
            disableGutters
            disablePadding
            sx={{
              display: 'block',
              ...(isSub && {
                position: 'relative',
                // Rounded elbow: a vertical rail segment that curves right into the
                // item's left edge. The first item starts at the parent's bottom edge;
                // every later item's segment starts at the previous item's elbow, so the
                // rail is continuous and the last elbow caps it.
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  pointerEvents: 'none',
                  left: -ELBOW_WIDTH,
                  width: ELBOW_WIDTH,
                  // The elbow's rounded corner eats `ELBOW_RADIUS` off the bottom of the
                  // rail, so each later segment starts that much higher to close the gap
                  // and meet the previous item's elbow. The first starts at the parent's
                  // bottom edge; the last elbow caps the rail.
                  top: index === 0 ? 0 : -(half + ELBOW_RADIUS - 3),
                  height: index === 0 ? half : row + ELBOW_RADIUS - 3,
                  borderLeft: `1.5px solid ${lineColor}`,
                  borderBottom: `1.5px solid ${lineColor}`,
                  borderBottomLeftRadius: ELBOW_RADIUS,
                },
              }),
            }}
          >
            <MenuItem
              item={item}
              active={active}
              highlighted={highlighted}
              sub={isSub}
              collapsed={false}
              onClick={() => {
                onItemClick?.(item);
              }}
            />
            {item.items && (
              <Collapse in={isExpanded(item)}>
                <MenuListFull items={item.items} onItemClick={onItemClick} level={level + 1} />
              </Collapse>
            )}
          </ListItem>
        );
      })}
    </Box>
  );
};
