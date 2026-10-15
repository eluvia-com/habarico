import React from 'react';
import {Box, Stack, Typography} from '@mui/material';
import {RouterLink} from '../../../atoms/RouterLink';
import {MarketingSlot} from '../../types';

export type MarketingFooterProps = MarketingSlot & {collapsed: boolean; inverted: boolean};

export const MarketingFooter = ({
  logo: Logo,
  label,
  href,
  collapsed,
  inverted,
}: MarketingFooterProps) => {
  const content = (
    <Stack alignItems="center" spacing={0.75}>
      {Logo && (
        <Logo
          monochromatic
          inverted={inverted}
          icon={collapsed}
          disableLink
          width={collapsed ? 24 : 72}
        />
      )}
      {!collapsed && label && (
        <Typography variant="caption" color="text.disabled">
          {label}
        </Typography>
      )}
    </Stack>
  );

  if (!href) return content;
  return (
    <Box
      component={RouterLink}
      href={href}
      sx={{display: 'block', textDecoration: 'none', color: 'inherit'}}
    >
      {content}
    </Box>
  );
};
