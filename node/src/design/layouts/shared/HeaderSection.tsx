import React, {ReactNode} from 'react';
import {
  AppBar,
  AppBarProps,
  Box,
  Breakpoint,
  Container,
  ContainerProps,
  Toolbar,
  ToolbarProps,
  useTheme,
} from '@mui/material';
import {bgBlur} from '../../theme/mixins';
import {varAlpha} from '../../theme/utils';
import {layoutClasses} from '../classes';

export type HeaderSectionProps = AppBarProps & {
  layoutBreakpoint: Breakpoint;
  slots?: {
    leftArea?: ReactNode;
    rightArea?: ReactNode;
    topArea?: ReactNode;
    centerArea?: ReactNode;
    bottomArea?: ReactNode;
  };
  slotProps?: {
    toolbar?: ToolbarProps;
    container?: ContainerProps;
  };
};

export function HeaderSection({
  sx,
  slots,
  slotProps,
  layoutBreakpoint = 'md',
  ...other
}: HeaderSectionProps) {
  const theme = useTheme();

  const toolbarSxs = {
    default: {
      // Transparent, frosted app bar: no solid fill (headerOpacity 0) — only a
      // backdrop blur, so content scrolling underneath is blurred through it.
      ...bgBlur({
        color: varAlpha(theme.palette.background.paperChannel, Number(theme.layout?.headerOpacity)),
        blur: parseInt(String(theme.layout?.headerBlur)),
      }),
      // `min-height`, not `height`: a floor the toolbar normally sits at exactly (single-line
      // content is shorter than this), but can still grow past when its content wraps to a
      // second line — e.g. breadcrumbs wrapping onto their own row below `sm` (see
      // `DashboardLayout`). `position="sticky"` means nothing else needs to know the resulting
      // height; the page content below just follows it in normal flow.
      minHeight: theme.layout?.headerMobileHeight,
      transition: theme.transitions.create(['min-height', 'background-color'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter,
      }),
      [theme.breakpoints.up(layoutBreakpoint)]: {
        minHeight: theme.layout?.headerDesktopHeight,
      },
    },
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      className={layoutClasses.header}
      sx={{
        boxShadow: 'none',
        zIndex: theme.layout?.headerZIndex,
        ...sx,
      }}
      {...other}
    >
      {slots?.topArea}

      <Toolbar
        disableGutters
        {...slotProps?.toolbar}
        sx={{
          ...toolbarSxs.default,
          ...slotProps?.toolbar?.sx,
        }}
      >
        <Container
          {...slotProps?.container}
          sx={{
            height: 1,
            display: 'flex',
            alignItems: 'center',
            ...slotProps?.container?.sx,
          }}
        >
          {slots?.leftArea}

          <Box
            sx={{
              display: 'flex',
              flex: '1 1 auto',
              justifyContent: 'center',
              // `align-items: center` on `Container` centers each item within its own flex line,
              // not the toolbar's overall height — when a `leftArea` item (e.g. breadcrumbs, see
              // `DashboardLayout`) wraps onto a second line, the *first* line would otherwise
              // shrink to its own content height and lose the toolbar's `minHeight` floor
              // entirely (nothing on that line asks for it any more). This item always stays on
              // the first line, so floor its height here to keep that line — and everything
              // centered within it (the nav trigger, `rightArea`'s icons/avatar) — at the
              // intended header height regardless of what wraps below it.
              minHeight: theme.layout?.headerMobileHeight,
              [theme.breakpoints.up(layoutBreakpoint)]: {
                minHeight: theme.layout?.headerDesktopHeight,
              },
            }}
          >
            {slots?.centerArea}
          </Box>

          {slots?.rightArea}
        </Container>
      </Toolbar>

      {slots?.bottomArea}
    </AppBar>
  );
}
