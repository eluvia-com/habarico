import {get} from 'lodash-es';
import React, {useState} from 'react';
import {ImageFieldProps, useRecordContext} from 'react-admin';
import {Icon, IconType} from '@design/atoms/Icon';
import {useDialog} from '@design/hooks/useDialog';
import {Box, SxProps, Theme, Typography} from '@mui/material';
import type {SystemStyleObject} from '@mui/system';

// react-admin's own `ImageField` has no `onError`/broken-image fallback, so the thumbnail is
// rendered here directly instead of delegating to it — this field is only ever used with a single
// image URL in this codebase (never react-admin's array-of-images mode), so nothing is lost.
const DEFAULT_THUMBNAIL_SX: SxProps<Theme> = {
  width: 200,
  height: 100,
  objectFit: 'contain',
  m: 0.5,
};

export const ImageField = ({source, title, emptyText, sx, ...rest}: ImageFieldProps) => {
  const record = useRecordContext(rest);
  const value = get(record, source);
  const url = value && typeof value === 'string' ? value : null;
  const alt = (title && get(record, title)?.toString()) || '';

  // --------------------------------------------------------------------------
  // Dialog
  // --------------------------------------------------------------------------

  const {Dialog, openDialog} = useDialog();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [dialogFailed, setDialogFailed] = useState(false);
  // A different url can replace an earlier broken one — re-attempt loading it instead of sticking
  // to the previous failure. Adjusted during render (React's recommended pattern for resetting
  // state on a prop change) rather than an effect, so there's no extra render pass.
  const [trackedUrl, setTrackedUrl] = useState(url);
  if (url !== trackedUrl) {
    setTrackedUrl(url);
    setThumbnailFailed(false);
    setDialogFailed(false);
  }

  if (!url) {
    return emptyText ? (
      <Typography component="span" variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    ) : null;
  }

  // Merged into both the thumbnail and its broken-image fallback, so a broken image keeps the
  // same footprint the loaded image would have had.
  const thumbnailSx = {...DEFAULT_THUMBNAIL_SX, ...(sx as SystemStyleObject<Theme>)};

  return (
    <>
      {thumbnailFailed ? (
        <Box
          onClick={openDialog}
          sx={{
            ...thumbnailSx,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.neutral',
          }}
        >
          <Icon icon={IconType.BrokenImage} size={32} sx={{color: 'text.disabled'}} />
        </Box>
      ) : (
        <Box
          component="img"
          src={url}
          alt={alt}
          title={alt}
          onClick={openDialog}
          onError={() => setThumbnailFailed(true)}
          sx={{...thumbnailSx, cursor: 'pointer', display: 'block'}}
        />
      )}
      <Dialog maxWidth={false} closeButtonSx={{color: 'common.white'}}>
        {dialogFailed ? (
          <Box
            sx={{
              width: 400,
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.neutral',
              borderRadius: 1,
            }}
          >
            <Icon icon={IconType.BrokenImage} size={48} sx={{color: 'text.disabled'}} />
          </Box>
        ) : (
          <Box
            component="img"
            src={url}
            onError={() => setDialogFailed(true)}
            sx={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: 'calc(100vw - 64px)',
              maxHeight: 'calc(100vh - 64px)',
              borderRadius: 1,
            }}
          />
        )}
      </Dialog>
    </>
  );
};
