import React, {ReactNode, useState} from 'react';
import type {ColorType} from '@design/theme/core';
import {varAlpha} from '@design/theme/utils';
import {Box, Card, CardProps, Chip, Divider, Stack} from '@mui/material';
import {Icon, IconType} from '../../atoms/Icon';

export type ImagePanelProps = CardProps & {
  /** Image URL rendered as the square media area. */
  src: string;
  /** Alternative text for the image. */
  alt?: string;
  /** Actions rendered as a right-aligned toolbar row below the content, separated by a divider. */
  actions?: ReactNode;
  /** Short label shown as a chip in the top-right corner of the image. */
  info?: string;
  /** Color of the `info` chip. */
  infoColor?: ColorType;
  /** Content rendered below the image. */
  children?: ReactNode;
  /** Click handler for the media area. */
  onClick?: () => void;
  /** Whether the media area shows the hover overlay and pointer cursor. */
  hoverable?: boolean;
};

/**
 * A square image tile on a `Card` surface: a cover image with an optional corner chip and a
 * hover overlay, plus a content area below for a caption and an actions slot. Purely
 * presentational — pass the image URL, labels and callbacks as props.
 */
export const ImagePanel = ({
  src,
  alt,
  actions,
  info,
  infoColor = 'info',
  children,
  onClick,
  hoverable = true,
  ...rest
}: ImagePanelProps) => {
  const [hover, setHover] = useState<boolean>(false);
  const [failed, setFailed] = useState(false);
  // A different src can replace an earlier broken one — re-attempt loading it instead of sticking
  // to the previous failure. Adjusted during render (React's recommended pattern for resetting
  // state on a prop change) rather than an effect, so there's no extra render pass.
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  return (
    <Card {...rest}>
      <Box
        onMouseEnter={hoverable ? () => setHover(true) : undefined}
        onMouseLeave={hoverable ? () => setHover(false) : undefined}
        onClick={onClick}
        sx={{pt: '100%', position: 'relative', cursor: hoverable ? 'pointer' : 'default'}}
      >
        {failed ? (
          <Box
            sx={{
              top: 0,
              width: 1,
              height: 1,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.neutral',
            }}
          >
            <Icon icon={IconType.BrokenImage} size={40} sx={{color: 'text.disabled'}} />
          </Box>
        ) : (
          <Box
            component="img"
            alt={alt}
            src={src}
            onError={() => setFailed(true)}
            sx={{
              top: 0,
              width: 1,
              height: 1,
              objectFit: 'cover',
              position: 'absolute',
            }}
          />
        )}
        {info && (
          <Chip
            variant="filled"
            color={infoColor}
            sx={{
              top: (t) => t.spacing(1),
              right: (t) => t.spacing(1),
              position: 'absolute',
              textTransform: 'uppercase',
            }}
            label={info}
            size="small"
          />
        )}
        {hoverable && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backdropFilter: `blur(6px)`,
              backgroundColor: (theme) => varAlpha(theme.palette.background.defaultChannel, 0.2),
              svg: {
                color: 'common.white',
                width: '50%',
                opacity: 0.4,
              },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: hover ? 1 : 0,
              transition: (theme) =>
                theme.transitions.create('opacity', {duration: theme.transitions.duration.short}),
            }}
          >
            <Icon icon={IconType.Fullscreen} sx={{fontSize: '8rem'}} />
          </Box>
        )}
      </Box>

      {children && (
        <Stack spacing={2} sx={{p: 2}}>
          {children}
        </Stack>
      )}
      {actions && (
        <>
          <Divider />
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{p: 1}}>
            {actions}
          </Stack>
        </>
      )}
    </Card>
  );
};
