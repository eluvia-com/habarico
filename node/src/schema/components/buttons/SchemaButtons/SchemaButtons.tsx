import React, {ReactNode} from 'react';
import {RecordContextProvider, useTranslate} from 'react-admin';
import {ActionButtonProps} from '@admin/components/buttons/ActionButton';
import {ResponsiveCount} from '@design/hooks/useOverflowCount';
import {OverflowToolbar} from '@design/molecules/OverflowToolbar';
import {Breakpoint} from '@mui/material';
import {ResolvedDescriptor, useResolvedDescriptors} from '@schema/hooks/useResolvedDescriptors';
import {AnyActionDescriptor, HabRecord} from '@schema/types';
import {SchemaButton} from '../SchemaButton';
import {SchemaMenuButton} from '../SchemaMenuButton';

// Wraps children with RecordContextProvider only when a record is available.
// When record is undefined (e.g. toolbar buttons in a standalone top-level list),
// the outer RecordContext is left intact.
const ConditionalRecordProvider = ({
  record,
  children,
}: {
  record?: HabRecord;
  children: ReactNode;
}) =>
  record ? (
    <RecordContextProvider value={record}>{children}</RecordContextProvider>
  ) : (
    <>{children}</>
  );

type ButtonVariant = ActionButtonProps['variant'];

export type SchemaButtonsProps = Omit<ActionButtonProps, 'variant' | 'showLabel'> & {
  record?: HabRecord;
  // the slot to render; absent renders nothing
  descriptors?: AnyActionDescriptor[];
  // the surface a `DefaultActions` entry expands for: a list keeps `showInList` actions
  isList?: boolean;
  target?: string;
  variant?: ButtonVariant | ((name: string) => ButtonVariant);
  showLabel?: boolean | ((name: string) => boolean);
  /**
   * Render every button icon-only (no label). Beyond the static `true` it also accepts a breakpoint
   * (e.g. `'sm'`) to force icon-only only below that width — the responsive collapse an enclosing
   * toolbar wants. Passed straight to the `OverflowToolbar`; overflow menu items always keep labels.
   */
  iconOnly?: boolean | Breakpoint;
  viewName?: string;
  /**
   * Max number of buttons shown inline before the surplus collapses into the `⋮` menu — the trigger is
   * always extra, never counted (same as `ButtonsStack`). A fixed number, or a per-breakpoint map
   * (e.g. `{xs: 1, lg: 2}`) that makes the toolbar responsive with no `useMediaQuery` at the call site.
   */
  maxVisibleButtons?: ResponsiveCount;
  /**
   * Fewest buttons kept inline when `maxVisibleButtons` overflows. Defaults to `1` (same as
   * `OverflowToolbar`), so a real button always stays next to the `⋮` trigger; pass `0` to allow every
   * button to collapse into the menu — e.g. the header toolbar on very narrow screens, where even a
   * single icon-only button next to the trigger costs more width than there's room for.
   */
  minVisibleButtons?: number;
};

// Normalize a value-or-resolver prop (`variant` / `showLabel`) into a per-action resolver function.
const asResolver = <T,>(value: T | ((name: string) => T)): ((name: string) => T) =>
  typeof value === 'function' ? (value as (name: string) => T) : () => value;

export const SchemaButtons = ({
  record: propRecord,
  isList = false,
  target,
  variant,
  showLabel,
  iconOnly,
  descriptors,
  viewName,
  maxVisibleButtons = 6,
  minVisibleButtons,
  ...rest
}: SchemaButtonsProps) => {
  const translate = useTranslate();
  const {record, actions, resolvedDescriptors} = useResolvedDescriptors({
    descriptors,
    record: propRecord,
    isList,
    viewName,
  });

  const variantFn = asResolver(variant);
  const showLabelFn = asResolver(showLabel);

  if (!actions || !resolvedDescriptors.length) return;

  // --------------------------------------------------------------------------
  // Render buttons
  //
  // Every button renders in its inline form; the `OverflowToolbar` decides which ones move into the
  // `⋮` menu and flips them to their `menuItem` surface via context (no manual `isMenu` split here).
  // A `menuItems` descriptor stays a nested split-menu button (`SchemaMenuButton`).
  // --------------------------------------------------------------------------

  const renderButton = ({descriptor, schema, actionContext}: ResolvedDescriptor, index: number) => {
    if (descriptor.menuItems) {
      return (
        <SchemaMenuButton
          {...rest}
          key={index}
          label={descriptor.label}
          target={target}
          descriptor={descriptor}
          showLabel={showLabel}
          variant={variant}
          record={record}
        />
      );
    }

    return (
      <SchemaButton
        {...rest}
        variant={variantFn(descriptor.name)}
        showLabel={showLabelFn(descriptor.name)}
        schema={schema}
        actionContext={actionContext}
        key={index}
        target={target}
        className={record?.id !== undefined ? `action-${descriptor.name}-${record.id}` : undefined}
      />
    );
  };

  // Mirror the buttons' own surface on the `⋮` trigger (icon buttons → an icon-button trigger).
  const toolbarSurface = rest.surface === 'iconButton' ? 'iconButton' : 'button';

  const moreLabel = translate('ra.action.more_actions', {_: 'More actions'});

  return (
    <ConditionalRecordProvider record={record}>
      <OverflowToolbar
        maxVisible={maxVisibleButtons}
        minVisible={minVisibleButtons}
        iconOnly={iconOnly}
        more={{surface: toolbarSurface, size: rest.size, label: moreLabel}}
      >
        {resolvedDescriptors.map((resolvedDescriptor, index) =>
          renderButton(resolvedDescriptor, index)
        )}
      </OverflowToolbar>
    </ConditionalRecordProvider>
  );
};
