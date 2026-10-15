import React from 'react';
import {varAlpha} from '@design/theme/utils';
import {formatBytes} from '@foundation/utils/file';
import {Box, Button, IconButton, LinearProgress, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {FileImagePreview} from '../../atoms/FileImagePreview';
import {FileTypePreview} from '../../atoms/FileTypePreview';
import {Icon, IconType} from '../../atoms/Icon';
import {FileRowStatus} from './FileRowStatus';
import {UploadAreaLabels, UploadFileItem} from './types';

/** Class on the delete button — drives the idle/active opacity (mirrors FormTable's row delete). */
const ROW_DELETE_CLASS = 'upload-file-row-delete';

// Mirrors the FormTable row: a neutral card that on hover gains a soft primary tint plus a 4px inset
// left accent stripe (an inset shadow, so no layout shift), with matching radius / padding / gap and
// a trailing delete. An errored row keeps a persistent error tint + stripe and a visible delete.
//
// Three cases tone this down:
// - `singleFile`: with only ever one row there's nothing to disambiguate, so it drops onto a
//   transparent surface, hover leaves it (and the stripe) untouched, and the delete sits at full
//   opacity (it's the sole action). An error still tints the row so the failure reads.
// - `noBorder` (embedded in a field): the hover stripe is dropped so no accent border bleeds into
//   the host field's frame.
// - `disabled` (read-only): the row is inert — no delete, so no hover affordance either.
const rowSx =
  (
    hasError: boolean,
    padding: number,
    singleFile: boolean,
    noBorder: boolean,
    disabled: boolean
  ): SxProps<Theme> =>
  (theme) => {
    // The tint/stripe are stronger in dark mode so they read on the darker surface.
    const isDark = theme.palette.mode === 'dark';
    const tint = isDark ? 0.2 : 0.08;
    const stripe = isDark ? 0.4 : 0.3;
    const accent = hasError ? theme.palette.error.mainChannel : theme.palette.primary.mainChannel;
    // A sole row drops onto a transparent surface (it reads as plain content); otherwise it's the
    // neutral card. An error tints either.
    const idleBg = singleFile ? 'transparent' : theme.palette.background.neutral;
    return {
      p: padding,
      borderRadius: 1,
      backgroundColor: hasError ? varAlpha(theme.palette.error.mainChannel, tint) : idleBg,
      boxShadow:
        hasError && !noBorder
          ? `inset 4px 0 0 0 ${varAlpha(theme.palette.error.mainChannel, stripe)}`
          : 'none',
      transition: theme.transitions.create(['background-color', 'box-shadow']),
      [`& .${ROW_DELETE_CLASS}`]: {
        color: theme.palette.error.main,
        opacity: hasError || singleFile ? 1 : 0.5,
        transition: theme.transitions.create('opacity'),
      },
      ...(singleFile || disabled
        ? {}
        : {
            '&:hover, &:focus-within': {
              backgroundColor: varAlpha(accent, tint),
              // Inset shadow (not a border) so the accent stripe adds no layout shift.
              ...(noBorder ? {} : {boxShadow: `inset 4px 0 0 0 ${varAlpha(accent, stripe)}`}),
              [`& .${ROW_DELETE_CLASS}`]: {opacity: 1},
            },
          }),
    };
  };

export type FileRowProps = {
  item: UploadFileItem;
  onRemove: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  labels: UploadAreaLabels;
  /** Row padding in theme spacing units — density-driven by the parent `UploadArea`. */
  padding: number;
  /** Sole-row variant: no hover highlight, delete stays at full opacity. */
  singleFile?: boolean;
  /** Borderless variant (embedded in a field): drops the 4px left accent stripe. */
  noBorder?: boolean;
};

export const FileRow = ({
  item,
  onRemove,
  onRetry,
  disabled,
  labels,
  padding,
  singleFile = false,
  noBorder = false,
}: FileRowProps) => {
  const {filename, fileSize, progress, error, previewUrl} = item;
  const isUploading = progress !== null;
  const hasSize = fileSize != null;

  return (
    <Box sx={rowSx(!!error, padding, singleFile, noBorder, !!disabled)}>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
        {previewUrl ? (
          <FileImagePreview src={previewUrl} alt={filename} />
        ) : (
          <FileTypePreview filename={filename} />
        )}

        <Box sx={{flex: 1, minWidth: 0}}>
          <Typography
            variant="subtitle2"
            sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
          >
            {filename}
          </Typography>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap'}}>
            {hasSize && (
              <Typography variant="caption" color="text.disabled">
                {formatBytes(fileSize)}
              </Typography>
            )}
            <FileRowStatus item={item} hasSize={hasSize} labels={labels} />
          </Box>
        </Box>

        {!disabled && (
          <IconButton
            className={ROW_DELETE_CLASS}
            size="small"
            onClick={onRemove}
            sx={{flexShrink: 0}}
          >
            <Icon icon={IconType.Delete} size={20} />
          </IconButton>
        )}
      </Box>

      {isUploading && (
        <LinearProgress
          variant="determinate"
          value={progress ?? 0}
          sx={{mt: 1, borderRadius: 1, height: 4}}
        />
      )}

      {error && onRetry && (
        <Box sx={{display: 'flex', justifyContent: 'center', mt: 1}}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={onRetry}
            startIcon={<Icon icon={IconType.Refresh} size={16} />}
          >
            {labels.tryAgain}
          </Button>
        </Box>
      )}
    </Box>
  );
};
