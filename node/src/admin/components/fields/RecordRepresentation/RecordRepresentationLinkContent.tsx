import React, {MouseEvent, ReactNode} from 'react';
import {Typography} from '@mui/material';

type RecordRepresentationLinkContentProps = {
  handleClick?: (event: MouseEvent) => void;
  children: ReactNode;
};

/**
 * `RecordRepresentation`'s text-link body: the representation as part of the surrounding text
 * rather than as a tag. It carries no icon and no action tooltip — the primary colour plus the
 * hover underline are the whole affordance — and renders as plain text when there is no view to
 * open. Presentational, on the same terms as the chip body: the link arrives already resolved.
 */
export const RecordRepresentationLinkContent = ({
  handleClick,
  children,
}: RecordRepresentationLinkContentProps) => (
  <Typography
    // Inline: `EllipsisWithTitle` sets the truncation up on its own container, and
    // `text-overflow` only reaches text in that container's own line boxes. `body2` renders a
    // `<p>` by default, whose text would sit in a nested block box and get hard-clipped
    // instead of ellipsised.
    component="span"
    variant="body2"
    color={handleClick ? 'primary' : 'inherit'}
    onClick={handleClick}
    // A clickable span is a button in everything but tag: without these it is unreachable by
    // keyboard, and invisible to anything asking "is this control interactive?" — which is how
    // the datagrid decides not to stack its row hint on top of a control that owns its click
    // (`useDatagridRowTooltip`). MUI's `Chip` brings all of this with it; a `Typography` does
    // not. Enter / Space go through the element's own click so the handler keeps receiving the
    // `MouseEvent` it is written against, modifier keys and all.
    role={handleClick ? 'button' : undefined}
    tabIndex={handleClick ? 0 : undefined}
    onKeyDown={
      handleClick
        ? (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.currentTarget.click();
          }
        : undefined
    }
    sx={handleClick ? {cursor: 'pointer', '&:hover': {textDecoration: 'underline'}} : undefined}
  >
    {children}
  </Typography>
);
