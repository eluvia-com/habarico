import React from 'react';
import {getExt} from '@foundation/utils/file';
import {Box} from '@mui/material';

// Extension → accent colour for the placeholder tile. Kept private to the component.
const EXT_COLORS: Record<string, string> = {
  jpg: '#F97316',
  jpeg: '#F97316',
  png: '#3B82F6',
  gif: '#3B82F6',
  svg: '#8B5CF6',
  webp: '#06B6D4',
  avif: '#06B6D4',
  pdf: '#EF4444',
  mp4: '#8B5CF6',
  mov: '#8B5CF6',
  avi: '#8B5CF6',
  mkv: '#8B5CF6',
  mp3: '#10B981',
  wav: '#10B981',
  doc: '#2563EB',
  docx: '#2563EB',
  xls: '#16A34A',
  xlsx: '#16A34A',
  ppt: '#EA580C',
  pptx: '#EA580C',
  zip: '#D97706',
  rar: '#D97706',
};

const extColor = (filename: string): string => EXT_COLORS[getExt(filename)] ?? '#6B7280';

export type FileTypePreviewProps = {filename: string};

/**
 * A file-row thumbnail placeholder for non-image files: a coloured 40×48 tile showing the file's
 * uppercase extension (colour keyed off the extension). The non-image sibling of `FileImagePreview`.
 */
export const FileTypePreview = ({filename}: FileTypePreviewProps) => {
  const ext = getExt(filename).toUpperCase() || '?';
  const color = extColor(filename);
  return (
    <Box
      sx={{
        width: 40,
        minHeight: 48,
        borderRadius: (t) => `${t.radius.md}px`,
        // Opaque paper base with the extension tint layered on top (a flat gradient over the
        // background colour), so the tile always composites over paper — the row's hover tint behind
        // it can't bleed through the semi-transparent fill and mix with the extension colour.
        bgcolor: 'background.paper',
        backgroundImage: `linear-gradient(${color}18, ${color}18)`,
        border: `1px solid ${color}38`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          bgcolor: color,
          borderRadius: (t) => `${t.radius.sm}px`,
          px: 0.5,
          py: 0.25,
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '0.03em',
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {ext.length > 4 ? ext.slice(0, 4) : ext}
      </Box>
    </Box>
  );
};
