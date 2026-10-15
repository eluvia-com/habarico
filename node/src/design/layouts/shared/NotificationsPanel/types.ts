import {IconButtonProps} from '@mui/material';
import {NotificationsLabels} from '../../types';

export type NotificationsToggleProps = IconButtonProps & {
  /** Tooltip shown on the bell. */
  tooltip?: string;
  /** Whether the associated panel is open (highlights the bell). */
  open?: boolean;
};

export type NotificationsPanelProps = {
  /** Whether the panel (and its backdrop) is visible. */
  open: boolean;
  /** Called when the backdrop or the close button is clicked. */
  onClose: () => void;
  /** Label overrides; English fallbacks are used for anything omitted. */
  labels?: Partial<NotificationsLabels>;
  /** Invoked by the footer "view all" action. */
  onViewAll?: () => void;
};
