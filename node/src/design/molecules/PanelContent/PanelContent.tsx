import React from 'react';
import {CardContent, Collapse, SxProps, Theme} from '@mui/material';
import {usePanelContext} from '../Panel/PanelContext';
import {PANEL_CONTENT_PADDING_STEPS} from './constants';

/** Content padding step. `none` is full-bleed; `medium` is the standard gutter. */
export type PanelContentPadding = 'none' | 'small' | 'medium';

export type PanelContentProps = {
  children: React.ReactNode;
  /**
   * Content padding: `medium` (default) is the standard gutter, `small` tightens it (e.g. a
   * gallery), `none` removes it for full-bleed content like datagrids.
   */
  paddingSize?: PanelContentPadding;
  /**
   * Full-bleed content (e.g. a datagrid or list): forces zero padding and clips overflow so the
   * content meets the panel's rounded edges. Overrides `paddingSize`.
   */
  flush?: boolean;
  /** Extra styles merged onto the content container. */
  sx?: SxProps<Theme>;
};

/**
 * Panel body. When the surrounding `Panel` is `collapsible`, it collapses/expands with
 * the header toggle. Built on MUI `CardContent`. Must be rendered inside a `Panel`.
 */
export const PanelContent = ({
  children,
  paddingSize = 'medium',
  flush = false,
  sx,
}: PanelContentProps) => {
  const {collapsible, collapsed} = usePanelContext();

  const padding = flush ? 0 : PANEL_CONTENT_PADDING_STEPS[paddingSize];

  const content = (
    <CardContent
      sx={{
        p: padding,
        // MUI adds paddingBottom:24 to the last CardContent (:last-child); keep the gutter symmetric.
        '&:last-child': {pb: padding},
        // Full-bleed body: clip the content (e.g. a datagrid) to the panel's rounded corners.
        ...(flush && {overflow: 'hidden'}),
        ...sx,
      }}
    >
      {children}
    </CardContent>
  );

  return collapsible ? <Collapse in={!collapsed}>{content}</Collapse> : content;
};
