import React from 'react';
import {Box, ButtonBase, SxProps, Theme, Tooltip} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';

export type SearchToggleProps = {
  /** Tooltip shown on the pill. */
  tooltip?: string;
  /** Whether the search overlay is open (highlights the pill). */
  open?: boolean;
  /** Keyboard-shortcut hint rendered in the trailing chip, e.g. `⌘K`. */
  shortcutLabel?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
};

/**
 * The header search trigger: a rounded pill with the search icon and a keyboard-shortcut
 * chip. Mirrors `SettingsToggle` / `NotificationsToggle` — the open state lives in the
 * layout, so this is a thin presentational trigger. Opening (and the ⌘/Ctrl+K binding)
 * is owned by `DashboardLayout`; the search content is rendered by `SearchOverlay`.
 */
export const SearchToggle = ({open, tooltip, shortcutLabel, onClick, sx}: SearchToggleProps) => {
  const pill = (
    <ButtonBase
      onClick={onClick}
      aria-label={tooltip}
      sx={[
        (theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: 36,
          pl: 1.25,
          pr: shortcutLabel ? 0.75 : 1.25,
          borderRadius: `${theme.radius.md}px`,
          color: open ? 'primary.main' : 'text.secondary',
          bgcolor: 'action.selected',
          transition: theme.transitions.create(['background-color', 'color']),
          '&:hover': {bgcolor: 'action.hover'},
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon icon={IconType.Search} width={20} />
      {shortcutLabel && (
        <Box
          component="span"
          sx={(theme) => ({
            display: 'inline-flex',
            alignItems: 'center',
            height: 24,
            px: 0.75,
            borderRadius: `${theme.radius.sm}px`,
            bgcolor: 'common.white',
            boxShadow: theme.customShadows.z1,
            color: 'grey.700',
            fontSize: 12,
            fontWeight: 'fontWeightBold',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          })}
        >
          {shortcutLabel}
        </Box>
      )}
    </ButtonBase>
  );

  return tooltip ? <Tooltip title={tooltip}>{pill}</Tooltip> : pill;
};
