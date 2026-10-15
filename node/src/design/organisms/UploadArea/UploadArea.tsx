import React, {useRef, useState} from 'react';
import {DENSITY_ROW_CARD_GAP, DENSITY_ROW_CARD_PADDING} from '@design/constants';
import {varAlpha} from '@design/theme/utils';
import {formatBytes} from '@foundation/utils/file';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import {Box, Stack, Typography} from '@mui/material';
import {FileRow} from './FileRow';
import {
  DEFAULT_UPLOAD_AREA_LABELS,
  UploadAreaDensity,
  UploadAreaLabels,
  UploadFileItem,
} from './types';
import {formatAccept, joinHintParts} from './utils';

// Density scales the gap between rows and each row's padding like `FormTable` (`DENSITY_ROW_CARD_*`)
// and — analogously, on a larger scale that keeps its GhostPanel look — the drop zone's padding, in
// theme spacing units.
const DENSITY_DROPZONE_PADDING: Record<UploadAreaDensity, number> = {
  compact: 2,
  standard: 3,
  comfortable: 4,
};

export type UploadAreaProps = {
  items: UploadFileItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onRetryItem?: (id: string) => void;
  onRemoveAll?: () => void;
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  dropZoneSubtext?: string;
  noBorder?: boolean;
  labels?: UploadAreaLabels;
  /** Row/drop-zone density — see {@link UploadAreaDensity}. Defaults to `standard`. */
  density?: UploadAreaDensity;
};

export const UploadArea = ({
  items,
  onAddFiles,
  onRemoveItem,
  onRetryItem,
  onRemoveAll,
  accept,
  maxFiles,
  maxFileSize,
  disabled,
  dropZoneSubtext,
  noBorder = false,
  labels = DEFAULT_UPLOAD_AREA_LABELS,
  density = 'standard',
}: UploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const singleFile = maxFiles === 1;
  const canAddMore = maxFiles == null || items.length < maxFiles;
  const isAnyUploading = items.some((e) => e.progress !== null);

  // A single-file limit needs no count hint: the drop zone vanishes once the one file is added, so
  // "1 file remaining" would state the obvious. Otherwise show how many more may still be added.
  const filesRemainingHint =
    maxFiles != null && !singleFile
      ? labels.filesRemainingHint(maxFiles - items.length)
      : undefined;
  const maxFileSizeHint =
    maxFileSize == null ? undefined : labels.maxFileSizeHint(formatBytes(maxFileSize));
  const dropZoneHint =
    dropZoneSubtext ?? joinHintParts(formatAccept(accept), filesRemainingHint, maxFileSizeHint);

  // `accept` and `maxFileSize` are NOT enforced here: both describe the file that ends up stored,
  // and a resize/crop modifier can still change its size, type and name after it is picked. They
  // are checked by the upload queue once the transform has run, which also lets a rejected file be
  // reported on its own row instead of vanishing from the drop. Here they remain hints - the drop
  // zone text and the picker's `accept` attribute. `maxFiles` is a cap on the list itself, so it
  // stays.
  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;
    let arr = Array.from(files);
    if (maxFiles != null) arr = arr.slice(0, maxFiles - items.length);
    if (arr.length > 0) onAddFiles(arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    (e.target as HTMLInputElement).value = '';
  };

  return (
    <Stack spacing={DENSITY_ROW_CARD_GAP[density]}>
      {canAddMore && (
        <Box
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          sx={(theme) => {
            // Hover and drag-over share one visual. With a frame: a primary tint + primary border on
            // the surface. Borderless (embedded in a field): nothing highlights — the host field owns
            // the hover/focus affordance, so the drop zone stays put.
            const active = noBorder
              ? {}
              : {
                  borderColor: 'primary.main',
                  backgroundColor: varAlpha(theme.palette.primary.mainChannel, 0.04),
                };
            return {
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 1,
              p: noBorder ? 1.5 : DENSITY_DROPZONE_PADDING[density],
              border: noBorder ? 'none' : '2px dashed',
              borderColor: 'divider',
              borderRadius: `${theme.radius.lg}px`,
              bgcolor: 'transparent',
              transition: 'border-color 0.2s, background-color 0.2s',
              opacity: disabled ? 0.5 : 1,
              ...(isDragOver ? active : {}),
              ...(disabled ? {} : {'&:hover': active}),
            };
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={!singleFile}
            accept={accept?.join(',')}
            style={{display: 'none'}}
            onChange={handleInputChange}
          />
          <Box
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            <NoteAddOutlinedIcon sx={{fontSize: 24}} />
          </Box>
          <Typography variant="body2" textAlign="center">
            <Box component="span" fontWeight={600} color="text.primary">
              {labels.clickToUpload}
            </Box>{' '}
            <Box component="span" color="text.secondary">
              {labels.orDragAndDrop}
            </Box>
          </Typography>
        </Box>
      )}

      {canAddMore && dropZoneHint && (
        <Typography variant="caption" color="text.disabled" textAlign="center">
          {dropZoneHint}
        </Typography>
      )}

      {items.length > 0 && onRemoveAll && !isAnyUploading && !disabled && !singleFile && (
        <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
          <Typography
            variant="caption"
            color="error"
            onClick={onRemoveAll}
            sx={{cursor: 'pointer', '&:hover': {textDecoration: 'underline'}}}
          >
            {labels.removeAll}
          </Typography>
        </Box>
      )}

      {items.map((item) => (
        <FileRow
          key={item.id}
          item={item}
          onRemove={() => onRemoveItem(item.id)}
          onRetry={onRetryItem ? () => onRetryItem(item.id) : undefined}
          disabled={disabled}
          labels={labels}
          padding={DENSITY_ROW_CARD_PADDING[density]}
          singleFile={singleFile}
          noBorder={noBorder}
        />
      ))}
    </Stack>
  );
};
