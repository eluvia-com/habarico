import React, {useState} from 'react';
import {
  Avatar,
  Box,
  ButtonBase,
  ButtonBaseProps,
  MenuItem,
  MenuList,
  menuItemClasses,
} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {usePopover} from '../../../hooks/usePopover';
import {varAlpha} from '../../../theme/utils';
import {LayoutWorkspace} from '../../types';

export type WorkspacesPopoverProps = ButtonBaseProps & {
  items: LayoutWorkspace[];
  collapsed?: boolean;
};

/**
 * A workspace's 24px circular logo. Falls back to a broken-image icon when `src` fails to load,
 * instead of the browser's default alt-text rendering. A component of its own (rather than a
 * render helper called per item) so each instance can track its own load-failure state.
 */
const WorkspaceAvatar = ({alt, src}: {alt: string; src: string}) => {
  const [failed, setFailed] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  if (failed) {
    return (
      <Avatar sx={{width: 24, height: 24}}>
        <Icon icon={IconType.BrokenImage} size={14} sx={{color: 'text.disabled'}} />
      </Avatar>
    );
  }

  return (
    <Avatar alt={alt} src={src} onError={() => setFailed(true)} sx={{width: 24, height: 24}} />
  );
};

export function WorkspacesPopover({items, collapsed, sx, ...rest}: WorkspacesPopoverProps) {
  const hasSomeWorkspaces = items.length > 0;
  const [currentWorkspace, setCurrentWorkspace] = useState<LayoutWorkspace | undefined>(items[0]);

  const {Popover, openPopover, closePopover} = usePopover();

  if (!hasSomeWorkspaces || !currentWorkspace) return null;
  return (
    <>
      <ButtonBase
        disableRipple
        onClick={openPopover}
        sx={{
          pl: 2,
          py: 2,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          borderRadius: (theme) => `${theme.radius.lg}px`,
          textAlign: 'left',
          justifyContent: 'flex-start',
          backgroundColor: (theme) => varAlpha(theme.palette.grey['500Channel'], 0.08),
          ...sx,
        }}
        {...rest}
      >
        <WorkspaceAvatar alt={currentWorkspace.title} src={currentWorkspace.logo} />

        {!collapsed && (
          <Box
            gap={1}
            flexGrow={1}
            display="flex"
            alignItems="center"
            sx={{typography: 'body2', fontWeight: 'fontWeightSemiBold'}}
          >
            {currentWorkspace.title}
            {currentWorkspace.info}
          </Box>
        )}

        {!collapsed && <Icon icon={IconType.UnfoldMore} width={16} sx={{color: 'text.disabled'}} />}
      </ButtonBase>

      <Popover>
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              p: 1.5,
              gap: 1.5,
              borderRadius: (theme) => `${theme.radius.md}px`,
              [`&.${menuItemClasses.selected}`]: {
                backgroundColor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {items.map((workspace) => (
            <MenuItem
              key={workspace.id}
              selected={workspace.id === currentWorkspace?.id}
              onClick={() => {
                closePopover();
                setCurrentWorkspace(workspace);
              }}
            >
              <WorkspaceAvatar alt={workspace.title} src={workspace.logo} />
              <Box component="span" sx={{flexGrow: 1}}>
                {workspace.title}
              </Box>
              {workspace.info}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
