import React from 'react';
import {
  Backdrop,
  Box,
  Button,
  Divider,
  Portal,
  Slide,
  Stack,
  SxProps,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';
import {alpha} from '@mui/material/styles';
import {CloseButton} from '../../atoms/CloseButton';
import {Icon, IconType} from '../../atoms/Icon';
import {Scrollbar} from '../../atoms/Scrollbar';

export type InspectorPanelProps = {
  /** Whether the panel (and its backdrop) is visible. */
  open: boolean;
  /** Called when the backdrop or the close button is clicked. */
  onClose: () => void;
  /** Panel heading. */
  title: React.ReactNode;
  /** Optional secondary line under the title. */
  subtitle?: React.ReactNode;
  /** Optional leading icon rendered before the title. */
  icon?: IconType | string;
  /** Grouped content — typically a sequence of `InspectorSection`s. */
  children: React.ReactNode;
  /**
   * When provided, a reset action is rendered in the footer. Ignored if a custom
   * `footer` is supplied.
   */
  onReset?: () => void;
  /** Label of the built-in reset action. */
  resetLabel?: React.ReactNode;
  /** Icon of the built-in reset action. */
  resetIcon?: IconType | string;
  /** Custom footer content, replacing the built-in reset action. */
  footer?: React.ReactNode;
  /** Panel width in pixels. */
  width?: number;
  /** Extra styles merged onto the panel surface. */
  sx?: SxProps<Theme>;
};

/**
 * A dismissible panel anchored to the right edge, floating over a dimmed backdrop.
 * Its body is a scrollable column of grouped sections (`InspectorSection`) with an
 * optional footer action (typically "reset"). Shared by application settings and
 * advanced filters — keep it presentational: all data and callbacks come via props.
 */
export const InspectorPanel = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  onReset,
  resetLabel = 'Reset',
  resetIcon = IconType.Autorenew,
  footer,
  width = 380,
  sx,
}: InspectorPanelProps) => {
  const theme = useTheme();
  const hasFooter = footer !== undefined || onReset !== undefined;

  return (
    // Portal to `document.body` so the fixed backdrop overlays the whole app (top bar, side nav)
    // regardless of where the panel is mounted — a toolbar-deep mount would otherwise trap the
    // backdrop inside a local stacking context and paint it under the layout (a modal-like overlay
    // must escape its ancestors, exactly as MUI Dialog/Drawer do).
    <Portal>
      {/* The backdrop styling (primary tint + blur) comes from the MuiBackdrop theme override, so it
          matches dialogs; here we only lay the panel out on the right. */}
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{
          zIndex: theme.zIndex.modal,
          justifyContent: 'flex-end',
          alignItems: 'stretch',
          p: 1,
        }}
      >
        <Slide direction="left" in={open} mountOnEnter unmountOnExit>
          <Box
            // Clicks inside the panel must not bubble to the backdrop (which closes it).
            onClick={(event) => event.stopPropagation()}
            sx={{
              position: 'relative',
              width,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: `${theme.radius.lg}px`,
              background: theme.palette.background.gradient?.subtle,
              ...sx,
            }}
          >
            <CloseButton onClick={onClose} />
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{px: 2, py: 1.75, pr: 6}}
            >
              {icon && (
                <Box pt={0.5}>
                  <Icon icon={icon} width={22} sx={{color: 'text.primary'}} />
                </Box>
              )}
              <Box sx={{flexGrow: 1, minWidth: 0}}>
                <Typography variant="h4" noWrap>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" sx={{color: 'divider'}}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Scrollbar fillContent sx={{minHeight: 0}}>
              {/* No horizontal padding here so the between-section dividers bleed to the
                panel edges; each section carries its own gutter. */}
              <Stack divider={<Divider />} spacing={2.5} sx={{py: 2.5}}>
                {children}
              </Stack>
            </Scrollbar>
            {hasFooter && (
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                {footer ?? (
                  <Button
                    variant="text"
                    color="inherit"
                    size="small"
                    onClick={onReset}
                    startIcon={<Icon icon={resetIcon} width={18} />}
                    sx={{color: 'text.secondary'}}
                  >
                    {resetLabel}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Slide>
      </Backdrop>
    </Portal>
  );
};

export type InspectorSectionProps = {
  /** Optional group heading shown above the section content. */
  label?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * A labelled group of controls within an `InspectorPanel`. Consecutive sections are
 * separated by a full-bleed divider by the panel itself; the section carries the
 * panel's horizontal gutter so its content aligns with the header and footer.
 */
export const InspectorSection = ({label, children, sx}: InspectorSectionProps) => (
  <Stack spacing={1.5} sx={{px: 2, ...sx}}>
    {label && (
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>
    )}
    {children}
  </Stack>
);

export type InspectorFieldProps = {
  /** Optional label shown above the control. */
  label?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * A single labelled control (label stacked above its input) inside an
 * `InspectorSection`.
 */
export const InspectorField = ({label, children, sx}: InspectorFieldProps) => (
  <Stack spacing={0.75} sx={sx}>
    {label && (
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    )}
    {children}
  </Stack>
);
