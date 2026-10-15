import React from 'react';
import {Box, Divider, Theme, useTheme} from '@mui/material';
import {MarketingSlot, StatusSlot} from '../../types';
import {MarketingFooter} from './MarketingFooter';
import {StatusFooter} from './StatusFooter';

// Each footer section is topped by a dashed divider tinted with the page background.
// Negative horizontal margin cancels the sidebar's padding so it spans edge to edge.
const dividerSx = (theme: Theme) => ({
  borderColor: 'background.default',
  mx: `calc(${theme.layout?.navPx} * -1)`,
});

export type NavFooterProps = {
  marketing?: MarketingSlot;
  status?: StatusSlot;
  collapsed?: boolean;
};

/**
 * Bottom-pinned sidebar footers: a configurable marketing footer (author logo +
 * label + link) and a status footer (version + environment). Each section is
 * topped by a dashed divider. The marketing logo is rendered monochromatic (its
 * `inverted` follows the colour mode) and switches to its icon in the collapsed
 * rail, where the status labels are dropped and the environment is abbreviated.
 * The environment `prod` is never displayed.
 *
 * These are static configuration, so they arrive as props (like the main logo),
 * not through the dynamic dashboard layout context.
 */
export const NavFooter = ({marketing, status, collapsed = false}: NavFooterProps) => {
  const inverted = useTheme().palette.mode === 'dark';

  const hasMarketing = !!marketing && (!!marketing.logo || !!marketing.label);
  const hasVersion = !!status?.version;
  const hasEnv = !!status?.environment && status.environment !== 'prod';
  const hasStatus = hasVersion || hasEnv;

  if (!hasMarketing && !hasStatus) return null;

  return (
    <Box sx={{flexShrink: 0}}>
      {hasMarketing && (
        <>
          <Divider sx={dividerSx} />
          <Box sx={{py: 2}}>
            <MarketingFooter {...marketing} collapsed={collapsed} inverted={inverted} />
          </Box>
        </>
      )}
      {hasStatus && status && (
        <>
          <Divider sx={dividerSx} />
          <Box sx={{py: 2}}>
            <StatusFooter {...status} collapsed={collapsed} />
          </Box>
        </>
      )}
    </Box>
  );
};
