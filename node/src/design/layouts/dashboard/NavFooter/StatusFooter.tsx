import React, {ReactNode} from 'react';
import {Chip, ChipProps, Stack, Typography} from '@mui/material';
import {LayoutEnvironment, StatusSlot} from '../../types';

// Environment chip colour; `prod` is never rendered so it is excluded.
const ENV_COLOR: Record<Exclude<LayoutEnvironment, 'prod'>, ChipProps['color']> = {
  dev: 'info',
  test: 'warning',
  staging: 'warning',
  uat: 'warning',
};

const StatusRow = ({label, children}: {label: ReactNode; children: ReactNode}) => (
  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Stack>
);

export type StatusFooterProps = StatusSlot & {collapsed: boolean};

export const StatusFooter = ({version, environment, labels, collapsed}: StatusFooterProps) => {
  const env = environment && environment !== 'prod' ? environment : undefined;
  const versionChip = <Chip size="small" variant="soft" color="default" label={version} />;
  const envChip = env && (
    <Chip
      size="small"
      variant="soft"
      color={ENV_COLOR[env]}
      // Collapsed rail has no room for labels, so abbreviate the environment.
      label={collapsed ? env.charAt(0).toUpperCase() : env.toUpperCase()}
    />
  );

  if (collapsed) {
    return (
      <Stack spacing={0.75} alignItems="center">
        {version && versionChip}
        {envChip}
      </Stack>
    );
  }

  return (
    <Stack spacing={0.75}>
      {version && <StatusRow label={labels?.version ?? 'Version'}>{versionChip}</StatusRow>}
      {env && <StatusRow label={labels?.environment ?? 'Environment'}>{envChip}</StatusRow>}
    </Stack>
  );
};
