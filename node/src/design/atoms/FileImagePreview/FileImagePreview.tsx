import React, {useState} from 'react';
import {Box} from '@mui/material';
import {Icon, IconType} from '../Icon';

export type FileImagePreviewProps = {
  src: string;
  alt?: string;
};

/**
 * A file-row thumbnail showing the file's actual image — a 40×48 rounded, cover-fitted `<img>`.
 * The image sibling of `FileTypePreview` (the non-image fallback tile). If `src` fails to load
 * (broken/expired URL), swaps to a centered icon tile instead of the browser's default alt-text
 * rendering, which overflows this small box.
 */
export const FileImagePreview = ({src, alt = ''}: FileImagePreviewProps) => {
  const [failed, setFailed] = useState(false);
  // A retry can hand this same row a new object URL — re-attempt loading it instead of sticking to
  // the earlier failure. Adjusted during render (React's recommended pattern for resetting state on
  // a prop change) rather than an effect, so there's no extra render pass.
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  if (failed) {
    return (
      <Box
        sx={{
          width: 40,
          minHeight: 48,
          borderRadius: (t) => `${t.radius.md}px`,
          bgcolor: 'background.neutral',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* 24px matches the glyph's native viewBox — scaling it down softens its thin diagonal
        strokes with anti-aliasing blur. */}
        <Icon icon={IconType.BrokenImage} size={24} sx={{color: 'text.disabled'}} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      sx={{
        width: 40,
        minHeight: 48,
        borderRadius: (t) => `${t.radius.md}px`,
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  );
};
