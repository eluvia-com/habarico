import React, {useState} from 'react';
import {Icon, IconType} from '@design/atoms/Icon';
import type {ColorType} from '@design/theme/core';
import {Box, Chip, Skeleton, Stack, SxProps, Theme, Typography, useTheme} from '@mui/material';

/** A single KPI tile: a bold figure over a muted caption. */
export type ObjectHeroMetric = {
  /** Prominent figure, e.g. `1` or `'3'`. */
  value: React.ReactNode;
  /** Muted caption under the value, e.g. "Smlouva o správě". */
  label: React.ReactNode;
};

/** A trailing status line: an indicator (dot, or icon) plus text. */
export type ObjectHeroStatus = {
  /** Status text, e.g. "Aktivní nemovitost". */
  label: React.ReactNode;
  /**
   * Semantic color. When set, both the indicator and the text are tinted with
   * `theme.palette[color].main`; when omitted, a neutral dot with default text.
   */
  color?: ColorType;
  /**
   * Optional leading icon that replaces the default dot (e.g. `IconType.CheckCircle`
   * for a completeness indicator). Inherits `color` when provided.
   */
  icon?: IconType | string;
};

export type ObjectHeroProps = {
  /** Primary heading, e.g. "Jihlavská 521/62, Praha – Michle". */
  title: React.ReactNode;
  /** Object type/category rendered inside a small grey pill Chip, e.g. "Nemovitost". */
  category?: React.ReactNode;
  /**
   * Attribute list rendered as the muted subtitle, joined by a middot (·), e.g.
   * `['Jednotka 521/62', 'byt', '2+1', '50 m²', 'Petr Kašák']`. Empty/omitted → no subtitle.
   */
  attributes?: React.ReactNode[];
  /** URL of the object's photo, shown as an 80px circular avatar. */
  image?: string;
  /**
   * Avatar fallback icon shown when `image` is absent. When neither `image` nor `icon` is
   * provided, no avatar is rendered at all.
   */
  icon?: IconType | string;
  /** KPI tiles rendered after the identity block. Omitted/empty → the row is not rendered. */
  metrics?: ObjectHeroMetric[];
  /** Status indicators stacked at the trailing edge. Omitted/empty → not rendered. */
  statuses?: ObjectHeroStatus[];
  /** When true, render skeleton placeholders instead of content. */
  loading?: boolean;
  /** Extra styles merged onto the root band. */
  sx?: SxProps<Theme>;
};

const AVATAR_SIZE = 92;

/**
 * A detail-page header band: an optional circular avatar (image or fallback icon), an identity
 * block (category chip, title and a middot-separated attribute subtitle), a row of KPI metric
 * tiles, and trailing status indicators. Purely presentational — it sits directly on the page
 * background (no card) and takes all data via props. The layout wraps on narrow widths.
 */
export const ObjectHero = ({
  title,
  category,
  attributes,
  image,
  icon,
  metrics,
  statuses,
  loading = false,
  sx,
}: ObjectHeroProps) => {
  const hasMetrics = !loading && !!metrics?.length;
  const hasStatuses = !loading && !!statuses?.length;
  const hasAttributes = !!attributes?.length;

  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 2.5,
          py: 2,
          width: '100%',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <HeroAvatar image={image} icon={icon} loading={loading} />

      {/* Identity block — grows to push the metrics and statuses to the trailing edge. */}
      <Box sx={{flexGrow: 1, minWidth: 200}}>
        {loading ? (
          <Stack>
            <Skeleton variant="rounded" width={84} height={20} sx={{mb: 1}} />
            <Skeleton width="55%" height={38} />
            <Skeleton width="75%" height={24} />
          </Stack>
        ) : (
          <Stack alignItems="flex-start">
            {category != null && category !== '' && (
              <Chip
                variant="soft"
                color="default"
                size="small"
                label={category}
                sx={{
                  mb: 1,
                }}
              />
            )}
            <Typography variant="h4">{title}</Typography>
            {hasAttributes && (
              <Typography variant="body2" sx={{color: 'text.secondary'}}>
                {joinMiddot(attributes)}
              </Typography>
            )}
          </Stack>
        )}
      </Box>

      {hasMetrics && (
        <Stack direction="row" spacing={1.5} sx={{flexWrap: 'wrap'}}>
          {metrics.map((metric, index) => (
            <MetricTile key={index} {...metric} />
          ))}
        </Stack>
      )}

      {hasStatuses && (
        <Stack spacing={0.5}>
          {statuses.map((status, index) => (
            <StatusItem key={index} {...status} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

/** Joins attribute nodes with a muted middot separator. */
const joinMiddot = (items: React.ReactNode[]): React.ReactNode =>
  items
    .filter((item) => item != null && item !== '')
    .map((node, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <Box component="span" sx={{mx: 0.75, opacity: 0.6}}>
            ·
          </Box>
        )}
        {node}
      </React.Fragment>
    ));

/**
 * Circular photo avatar. Falls back to the `icon` prop — and, failing that, a generic broken-image
 * icon — when `image` is absent or fails to load. Renders nothing when neither `image` nor `icon`
 * is provided.
 */
const HeroAvatar = ({
  image,
  icon,
  loading,
}: Pick<ObjectHeroProps, 'image' | 'icon' | 'loading'>) => {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const [trackedImage, setTrackedImage] = useState(image);
  if (image !== trackedImage) {
    setTrackedImage(image);
    setFailed(false);
  }

  if (!image && !icon) return null;

  const base = {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    flexShrink: 0,
    borderRadius: '50%',
    overflow: 'hidden',
  } as const;

  if (loading) return <Skeleton variant="circular" sx={base} />;

  if (image && !failed) {
    return (
      <Box
        component="img"
        src={image}
        alt=""
        onError={() => setFailed(true)}
        sx={{...base, objectFit: 'cover', display: 'block'}}
      />
    );
  }

  return (
    <Box
      sx={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.divider,
        color: 'text.secondary',
      }}
    >
      <Icon icon={icon ?? 'BrokenImage'} size={32} />
    </Box>
  );
};

/** One KPI tile: a bold value over a muted caption, with no frame. */
const MetricTile = ({value, label}: ObjectHeroMetric) => (
  <Box
    sx={{
      px: 2,
      pt: 1,
      pb: 1.5,
      minWidth: 88,
      backgroundColor: 'background.paper',
      borderRadius: (t) => `${t.radius.lg}px`,
    }}
  >
    <Typography variant="h3">{value}</Typography>
    <Typography variant="caption" sx={{color: 'text.secondary'}}>
      {label}
    </Typography>
  </Box>
);

/** One status line: a colored dot (or icon) plus text; both tinted when `color` is set. */
const StatusItem = ({label, color, icon}: ObjectHeroStatus) => {
  const theme = useTheme();
  const tint = color ? theme.palette[color].main : undefined;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon ? (
        <Icon icon={icon} size={18} sx={{color: tint ?? theme.palette.text.secondary}} />
      ) : (
        <Box p={'2px'}>
          <Box
            sx={{
              width: 14,
              height: 14,
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: tint ?? theme.palette.text.disabled,
            }}
          />
        </Box>
      )}
      <Typography variant="body2" sx={{color: tint ?? 'text.primary', whiteSpace: 'nowrap'}}>
        {label}
      </Typography>
    </Stack>
  );
};
