import React from 'react';
import {Icon, IconType} from '../../atoms/Icon';
import {LayoutAccountMenuItem} from '../types';

export const _accountMenuItems: LayoutAccountMenuItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: <Icon width={22} icon={IconType.Home} />,
  },
  {
    title: 'Profile',
    path: '#',
    icon: <Icon width={22} icon={IconType.AccountCircle} />,
  },
  {
    title: 'Settings',
    path: '#',
    icon: <Icon width={22} icon={IconType.Settings} />,
  },
  {
    title: 'Logout',
    path: '#',
    tag: 'logout',
  },
];
