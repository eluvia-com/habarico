import React from 'react';
import {Chip} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {LayoutMenuItem} from '../types';

export const _menuItems: LayoutMenuItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <Icon width={22} icon={IconType.BarChart} />,
  },
  {
    title: 'User',
    href: '/user',
    icon: <Icon width={22} icon={IconType.Groups} />,
  },
  {
    title: 'Products',
    href: '/product',
    icon: <Icon width={22} icon={IconType.ShoppingCart} />,
    info: <Chip color="error" variant="soft" size="small" label="+3" />,
    items: [
      {
        title: 'New products',
        href: '/product/new',
        icon: <Icon width={22} icon={IconType.ShoppingCart} />,
      },
      {
        title: 'Used products',
        href: '/product/used',
        icon: <Icon width={22} icon={IconType.ShoppingCart} />,
      },
    ],
  },
  {
    title: 'Product stock',
    href: '/product-stock',
    icon: <Icon width={22} icon={IconType.Warehouse} />,
    items: [
      {
        title: 'Stocked products',
        href: '/product-stock',
        icon: <Icon width={22} icon={IconType.Warehouse} />,
      },
    ],
  },
  {
    title: 'Blog',
    href: '/blog',
    icon: <Icon width={22} icon={IconType.Description} />,
  },
  {
    title: 'External link',
    href: 'https://example.com',
    icon: <Icon width={22} icon={IconType.Link} />,
  },
];
