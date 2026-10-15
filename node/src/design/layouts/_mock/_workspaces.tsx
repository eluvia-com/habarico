import React from 'react';
import {Chip} from '@mui/material';
import {LayoutWorkspace} from '../types';
import {_id} from './utils';

export const _workspaces: LayoutWorkspace[] = [
  {
    id: _id(0),
    title: 'Team 1',
    logo: 'https://i.pravatar.cc/300?img=1',
    info: <Chip color="default" variant="soft" size="small" label="Free" />,
  },
  {
    id: _id(1),
    title: 'Team 2',
    logo: 'https://i.pravatar.cc/300?img=2',
    info: <Chip color="info" size="small" label="Pro" />,
  },
  {
    id: _id(2),
    title: 'Team 3',
    logo: 'https://i.pravatar.cc/300?img=3',
    info: <Chip color="info" size="small" label="Pro" />,
  },
];
