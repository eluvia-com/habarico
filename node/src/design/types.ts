import type {SxProps, Theme} from '@mui/material';

/**
 * Props shared by presentational design-layer primitives. The design layer is
 * schema-agnostic and props-driven, so every primitive accepts the standard MUI
 * styling escape hatches. Concrete components extend this with their own props.
 */
export interface DesignPrimitiveProps {
  /** MUI system styles applied to the root element. */
  sx?: SxProps<Theme>;
  /** Optional class name forwarded to the root element. */
  className?: string;
}
