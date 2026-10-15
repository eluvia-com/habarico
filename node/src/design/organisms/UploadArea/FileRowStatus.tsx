import React from 'react';
import {CircularProgress, Typography} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {UploadAreaLabels, UploadFileItem} from './types';

type FileRowStatusProps = {
  item: UploadFileItem;
  hasSize: boolean;
  labels: UploadAreaLabels;
};

export const FileRowStatus = ({item, hasSize, labels}: FileRowStatusProps) => {
  const {progress, error, processing} = item;
  const isUploading = progress !== null;

  if (!isUploading && processing) {
    return (
      <>
        {hasSize && (
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
        )}
        <CircularProgress size={10} sx={{flexShrink: 0}} />
        <Typography variant="caption" color="text.secondary">
          {labels.processing}
        </Typography>
      </>
    );
  }

  if (isUploading) {
    return (
      <>
        {hasSize && (
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
        )}
        <CircularProgress size={10} sx={{flexShrink: 0}} />
        <Typography variant="caption" color="text.secondary">
          {labels.uploading} {progress}%
        </Typography>
      </>
    );
  }

  if (item.uploaded && !isUploading && !error) {
    return (
      <>
        {hasSize && (
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
        )}
        <Icon
          icon={IconType.CheckCircleOutline}
          size={12}
          sx={{color: 'success.main', flexShrink: 0}}
        />
        <Typography variant="caption" color="success.main">
          {labels.uploadComplete}
        </Typography>
      </>
    );
  }

  if (error) {
    return (
      <>
        {hasSize && (
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
        )}
        <Icon icon={IconType.ErrorOutline} size={12} sx={{color: 'error.main', flexShrink: 0}} />
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      </>
    );
  }

  return null;
};
