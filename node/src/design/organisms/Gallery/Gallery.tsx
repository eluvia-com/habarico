import React, {useCallback, useEffect, useState} from 'react';
import {varAlpha} from '@design/theme/utils';
import {Box, CircularProgress, IconButton, Skeleton, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';
import {useDialog} from '../../hooks/useDialog';

const DEFAULT_MAX_DOTS = 10;

// Translucent dark scrim used behind the overlaid controls (arrows, dots, loading), so they read on
// top of any photo. `common.blackChannel` keeps it theme-token driven rather than a hardcoded rgba.
const scrim = (theme: Theme, opacity: number) =>
  varAlpha(theme.palette.common.blackChannel, opacity);

export type GalleryImage = {
  /** Full-size image URL. */
  url: string;
  /** Alt text / caption for the image. */
  alt?: string;
};

export type GalleryProps = {
  /** Images to display, in order (the slides loaded so far). */
  images: readonly GalleryImage[];
  /**
   * Total number of images when more can exist than are currently in `images` — e.g. a backend
   * infinite-pagination feed that loads pages lazily. Defaults to `images.length`. Drives the
   * arrows and dots so navigation can reach not-yet-loaded slides (pair with `onIndexChange`).
   */
  total?: number;
  /** Controlled current index. Omit for uncontrolled mode (internal state). */
  index?: number;
  /** Initial index in uncontrolled mode. Defaults to `0`. */
  defaultIndex?: number;
  /** Fired when the user navigates (arrows, dots, keyboard) — with the clamped target index. */
  onIndexChange?: (index: number) => void;
  /** Initial loading — show a skeleton instead of an image. */
  loading?: boolean;
  /**
   * Show a loading overlay on the current slide — e.g. while the page containing it is fetched.
   * Also inferred automatically when the current index is beyond the loaded `images`.
   */
  slideLoading?: boolean;
  /** How the photo fills the frame. `cover` (default) fills edge-to-edge; `contain` never crops. */
  objectFit?: 'cover' | 'contain';
  /** Aspect ratio of the viewer frame. Defaults to `'4 / 3'`. */
  aspectRatio?: number | string;
  /** Centered, muted message shown when there are no images (and not `loading`). */
  emptyMessage?: React.ReactNode;
  /** Disable the click-to-open fullscreen lightbox. */
  disableLightbox?: boolean;
  /** Maximum number of navigation dots. Defaults to `10`. */
  maxDots?: number;
  /** Extra styles merged onto the viewer frame. */
  sx?: SxProps<Theme>;
};

/** A translucent, circular previous/next control overlaid on the photo. */
const NavArrow = ({direction, onClick}: {direction: 'prev' | 'next'; onClick: () => void}) => (
  <IconButton
    aria-label={direction === 'prev' ? 'Previous image' : 'Next image'}
    onClick={onClick}
    sx={(theme) => ({
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      [direction === 'prev' ? 'left' : 'right']: 8,
      zIndex: 2,
      width: 40,
      height: 40,
      color: 'common.white',
      bgcolor: scrim(theme, 0.35),
      '&:hover': {bgcolor: scrim(theme, 0.55)},
    })}
  >
    <Icon icon={direction === 'prev' ? IconType.ChevronLeft : IconType.ChevronRight} size={24} />
  </IconButton>
);

/** A centered dark scrim with a spinner, covering the current slide while it loads. */
const LoadingOverlay = ({size = 40}: {size?: number}) => (
  <Box
    sx={(theme) => ({
      position: 'absolute',
      inset: 0,
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: scrim(theme, 0.25),
    })}
  >
    <CircularProgress size={size} sx={{color: 'common.white'}} />
  </Box>
);

type DotsProps = {
  /** Number of dots to render (already capped at `maxDots`). */
  count: number;
  /** Effective total number of slides the dots map onto. */
  total: number;
  /** Current slide index. */
  index: number;
  onSelect: (index: number) => void;
};

/**
 * Bottom-center dot indicators. When there are more slides than dots the dots map proportionally
 * onto the full range, so a click jumps to the matching slide and the nearest dot lights up.
 */
const Dots = ({count, total, index, onSelect}: DotsProps) => {
  const activeDot = count > 1 ? Math.round((index * (count - 1)) / (total - 1)) : 0;
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        display: 'flex',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: `${theme.radius.pill}px`,
        bgcolor: scrim(theme, 0.35),
      })}
    >
      {Array.from({length: count}).map((_, dot) => (
        <Box
          key={dot}
          onClick={() => onSelect(count > 1 ? Math.round((dot * (total - 1)) / (count - 1)) : 0)}
          sx={{p: '6px', display: 'flex', cursor: 'pointer'}}
        >
          <Box
            sx={(theme) => ({
              width: 8,
              height: 8,
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              bgcolor:
                dot === activeDot
                  ? 'common.white'
                  : varAlpha(theme.palette.common.whiteChannel, 0.45),
            })}
          />
        </Box>
      ))}
    </Box>
  );
};

/**
 * A presentational photo gallery — a single-image carousel with translucent prev/next arrows, a row
 * of up to `maxDots` position dots and a click-to-open fullscreen lightbox (arrows + ←/→ keys). It
 * is purely presentational and data-source-agnostic: pass the loaded `images`; for backend infinite
 * pagination also pass `total` and control `index` via `onIndexChange`, fetching the next page when
 * the reported index runs past the loaded slides (mark that slide with `slideLoading`). Panel-agnostic
 * — drop it inside a `Panel` (`PanelContent`, usually `paddingSize="small"`) or use it standalone.
 */
export const Gallery = ({
  images,
  total,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loading = false,
  slideLoading = false,
  objectFit = 'cover',
  aspectRatio = '4 / 3',
  emptyMessage = 'No photos',
  disableLightbox = false,
  maxDots = DEFAULT_MAX_DOTS,
  sx,
}: GalleryProps) => {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const isControlled = indexProp != null;

  const effectiveTotal = total ?? images.length;
  const maxIndex = Math.max(0, effectiveTotal - 1);
  const index = Math.min(Math.max(isControlled ? indexProp : internalIndex, 0), maxIndex);

  const {Dialog, openDialog, open} = useDialog();

  const navigate = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), maxIndex);
      if (!isControlled) {
        setInternalIndex(clamped);
      }
      onIndexChange?.(clamped);
    },
    [isControlled, maxIndex, onIndexChange]
  );

  // Arrow-key navigation, active only while the fullscreen lightbox is open.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        navigate(index - 1);
      } else if (event.key === 'ArrowRight') {
        navigate(index + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, navigate, index]);

  const current = images[index];
  const showControls = effectiveTotal > 1;
  // The current index can point past the loaded slides while the next page is still being fetched.
  const isSlideLoading = slideLoading || (images.length > 0 && index >= images.length);
  const dotCount = Math.min(effectiveTotal, maxDots);

  return (
    <>
      <Box
        sx={[
          (theme) => ({
            position: 'relative',
            width: '100%',
            aspectRatio,
            overflow: 'hidden',
            borderRadius: `${theme.radius.md}px`,
            backgroundColor: 'background.default',
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {loading && <Skeleton variant={'rectangular'} sx={{width: '100%', height: '100%'}} />}

        {!loading && images.length === 0 && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant={'body2'} sx={{color: 'text.secondary'}}>
              {emptyMessage}
            </Typography>
          </Box>
        )}

        {!loading && images.length > 0 && (
          <>
            {current && (
              <Box
                component={'img'}
                key={index}
                src={current.url}
                alt={current.alt ?? ''}
                onClick={disableLightbox ? undefined : () => openDialog()}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit,
                  cursor: disableLightbox ? 'default' : 'pointer',
                }}
              />
            )}

            {isSlideLoading && <LoadingOverlay />}

            {showControls && index > 0 && (
              <NavArrow direction={'prev'} onClick={() => navigate(index - 1)} />
            )}
            {showControls && index < maxIndex && (
              <NavArrow direction={'next'} onClick={() => navigate(index + 1)} />
            )}
            {showControls && (
              <Dots count={dotCount} total={effectiveTotal} index={index} onSelect={navigate} />
            )}
          </>
        )}
      </Box>

      {!disableLightbox && (
        <Dialog maxWidth={false} closeButtonSx={{color: 'common.white'}}>
          <Box sx={{position: 'relative', width: 'min(90vw, 1200px)', aspectRatio}}>
            {current && (
              <Box
                component={'img'}
                src={current.url}
                alt={current.alt ?? ''}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )}

            {isSlideLoading && <LoadingOverlay size={48} />}

            {showControls && index > 0 && (
              <NavArrow direction={'prev'} onClick={() => navigate(index - 1)} />
            )}
            {showControls && index < maxIndex && (
              <NavArrow direction={'next'} onClick={() => navigate(index + 1)} />
            )}
          </Box>
        </Dialog>
      )}
    </>
  );
};
