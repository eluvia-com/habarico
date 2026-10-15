import React from 'react';
import {IconType} from '@design/atoms/Icon';
import {Panel} from '@design/molecules/Panel';
import {PanelContent, type PanelContentPadding} from '@design/molecules/PanelContent';
import {PanelFooter} from '@design/molecules/PanelFooter';
import {PanelHeader} from '@design/molecules/PanelHeader';
import {Section} from '@design/molecules/Section';
import {SectionContent} from '@design/molecules/SectionContent';
import {SectionFooter} from '@design/molecules/SectionFooter';
import {SectionHeader} from '@design/molecules/SectionHeader';
import type {ColorType} from '@design/theme/core';
import {SxProps, Theme} from '@mui/material';
import {BoxSchema} from '@schema/types';
import {useBoxLayout} from './useBoxLayout';

export type BoxLayoutProps = {
  /** The box schema — drives the collapsible behaviour and the padding/flush defaults (by `type`). */
  schema: BoxSchema;
  /**
   * Whether the box shows card chrome. `true` → `Panel` (surface + shadow); `false` → the
   * card-less `Section`. Kept an explicit per-box decision so each box owns its own card formula.
   */
  card: boolean;
  /** Header title. Falsy → the header row is omitted (a card box still keeps it when collapsible). */
  label?: React.ReactNode;
  /** Optional leading header icon (card / `Panel` header only; `Section` has no icon slot). */
  icon?: IconType | string;
  /** Semantic palette color for the leading header icon (and its badge tint). Defaults to `primary`. */
  iconColor?: ColorType;
  /** Header actions rendered on the right of the header (e.g. the box's toolbar actions). */
  action?: React.ReactNode;
  /** Left footer slot (e.g. a back / prev button). The footer renders only when a slot is set. */
  footerLeft?: React.ReactNode;
  /** Right footer slot (e.g. the box's bottom actions). The footer renders only when a slot is set. */
  footerRight?: React.ReactNode;
  /** Override the type-derived content padding. */
  paddingSize?: PanelContentPadding;
  /** Override the type-derived full-bleed flag. */
  flush?: boolean;
  /** Fill the available height — pass when the box holds a growing child (a nested box / a list). */
  fullHeight?: boolean;
  /** Extra styles merged onto the content region. */
  contentSx?: SxProps<Theme>;
  /** Box body — a PropertyList, a PanelGrid or a collection, built by the box. */
  children: React.ReactNode;
};

/**
 * Maps a box schema onto the design-layer surface primitives: a card box renders as
 * `Panel` + `PanelHeader` / `PanelContent` / `PanelFooter`; a card-less box renders as the
 * transparent `Section` + `SectionHeader` / `SectionContent` / `SectionFooter` counterparts.
 *
 * BoxLayout owns the box footer (the `footerLeft` / `footerRight` slots) and derives the content
 * padding, full-bleed and collapsible behaviour from the schema (see {@link useBoxLayout}), so a
 * box only supplies its card decision, its header/footer nodes and its body. The `Panel`
 * auto-selects its root/nested variant from `InsidePanelContext`, so BoxLayout never sets a
 * variant itself.
 */
export const BoxLayout = ({
  schema,
  card,
  label,
  icon,
  iconColor,
  action,
  footerLeft,
  footerRight,
  paddingSize,
  flush,
  fullHeight = false,
  contentSx,
  children,
}: BoxLayoutProps) => {
  const resolved = useBoxLayout(schema);
  const resolvedPadding = paddingSize ?? resolved.paddingSize;
  const resolvedFlush = flush ?? resolved.flush;
  const hasFooter = Boolean(footerLeft || footerRight);

  // When the box fills its height, the content region becomes a growing flex column so a growing
  // child (a nested box grid or a list) can reach the bottom. `Section`/`SectionContent` already
  // model this via `fullHeight`; `PanelContent` gets the same treatment through its `sx`.
  const fillContentSx: SxProps<Theme> | undefined = fullHeight
    ? {flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}
    : undefined;

  if (card) {
    // A collapsible box keeps its header even without a label — the header hosts the toggle.
    const showHeader = Boolean(label || action || resolved.collapsible);
    return (
      <Panel
        collapsible={resolved.collapsible}
        defaultCollapsed={resolved.defaultCollapsed}
        fullHeight={fullHeight}
      >
        {showHeader && (
          <PanelHeader label={label} icon={icon} iconColor={iconColor} actions={action} />
        )}
        <PanelContent
          paddingSize={resolvedPadding}
          flush={resolvedFlush}
          sx={{...fillContentSx, ...contentSx}}
        >
          {children}
        </PanelContent>
        {hasFooter && <PanelFooter left={footerLeft} right={footerRight} />}
      </Panel>
    );
  }

  const showHeader = Boolean(label || action);
  return (
    <Section fullHeight={fullHeight}>
      {showHeader && <SectionHeader label={label} actions={action} />}
      <SectionContent fullHeight={fullHeight} sx={contentSx}>
        {children}
      </SectionContent>
      {hasFooter && <SectionFooter left={footerLeft} right={footerRight} sx={{mt: 2}} />}
    </Section>
  );
};
