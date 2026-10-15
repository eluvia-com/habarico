import React from 'react';
import {Box} from '@mui/material';

/** The separator between breadcrumb items — a small `divider`-coloured dot. */
export const DataBreadcrumbSeparator = () => (
  <Box
    component="span"
    sx={{width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider', flexShrink: 0}}
  />
);
