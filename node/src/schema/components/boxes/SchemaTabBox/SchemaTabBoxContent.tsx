import React, {startTransition, useEffect, useMemo, useState} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {NextButton} from '@admin/components/common/NextButton';
import {PrevButton} from '@admin/components/common/PrevButton';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {NavigationHeader} from '@design/molecules/NavigationHeader';
import {SectionFooter} from '@design/molecules/SectionFooter';
import {useTabBox} from '@foundation/hooks/useTabsLocation';
import {Box, Tabs} from '@mui/material';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {ParentBoxProvider, useParentBoxContext} from '@schema/contexts/ParentBoxContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {BoxSchema} from '@schema/types';
import {isBoxSchema} from '@schema/utils/api';
import {SchemaBoxTab} from './SchemaBoxTab';
import {SchemaTabBoxPanel} from './SchemaTabBoxPanel';
import {SchemaTabBoxProps} from './types';

export const SchemaTabBoxContent = ({
  schema,
  excludeFields,
  actions,
  isRoot,
  label = schema.label,
}: SchemaTabBoxProps) => {
  const {readOnly} = useViewSchemaContext();
  const isLast = useIsLastPanel();
  // Card evaluation as on the grid box, minus the toolbar: a label or `collapsible` turn the card
  // on and an explicit `card` wins both ways, but toolbar actions do not — they live in the tab
  // strip, not in a card header. The root-box default is never kept here either: a tab box renders
  // box children only (fields are filtered out below), so it holds nothing that would need the
  // surface, and the default travels on to the step.
  const card = useBoxCard(schema, Boolean(label || schema.collapsible), false);
  // A card is the surface the steps sit on, so they are no longer a root.
  const childIsRoot = Boolean(isRoot && !card);
  const {getBoxName, isHidden} = useParentBoxContext();
  const parentBoxName = getBoxName(schema.name);
  // Owning the path also claims it, so the view keeps this box's tab and sweeps the ones left
  // behind by the view it was switched from.
  const {activeTab, setTab} = useTabBox(parentBoxName);
  const {showToolbarNavigation = false} = schema.tab ?? {};

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };
  // `DynamicBoxSchemaComponentWrapper` has already dropped the tabs whose `showQuery` is false, so
  // each one renders through `SchemaBoxBody` rather than `SchemaBox`, which would check it again.
  const schemaBoxes = useMemo(() => (schema.boxes || []).filter(isBoxSchema), [schema.boxes]);
  const activeBox = schemaBoxes.find((box) => box.name === activeTab);

  useEffect(() => {
    if (isHidden || activeBox || schemaBoxes.length === 0) return;
    setTab(schemaBoxes[0].name);
  }, [activeBox, activeTab, schema, setTab, isHidden, schemaBoxes]);

  // Edit mode mounts every tab at once — the inactive ones hidden with `display: none`, because a
  // field that is not mounted is not registered with react-hook-form and would not be submitted.
  // On a resource with many tabs that makes the read -> edit switch pay for the whole form in one
  // synchronous commit. So mount the active tab first and let the rest in on a transition right
  // after the first commit: the switch paints immediately and the hidden tabs fill in behind it,
  // still all registered, only a frame later. A passive effect (not `requestAnimationFrame`) drives
  // it so it also runs in a backgrounded tab, where rAF never fires and the tabs would otherwise
  // never mount. Read mode does not go through this at all — it renders the active tab only.
  const [inactiveTabsMounted, setInactiveTabsMounted] = useState(false);
  useEffect(() => {
    if (inactiveTabsMounted) return;
    startTransition(() => setInactiveTabsMounted(true));
  }, [inactiveTabsMounted]);

  // Memoized: `ParentBoxProvider` doesn't memoize its own `value` — a fresh object here on every
  // render (as before) invalidates the context for every descendant, including every tab's panel
  // below, regardless of whether anything actually changed.
  const parentBoxValue = useMemo(
    () => ({parentBoxName, parentBoxSchema: schema, isHidden}),
    [parentBoxName, schema, isHidden]
  );

  const currentBox = activeBox ? activeBox : schemaBoxes[0];
  if (!currentBox) return null;

  const activeBoxIndex = schemaBoxes.findIndex((box) => box.name === currentBox.name);
  const goToTab = (box?: BoxSchema) => {
    if (box) setTab(box.name);
  };

  // Tabs switch freely, so the bottom actions (e.g. Save) are shown on every tab, alongside the
  // optional prev/next navigation. These land in a `SectionFooter` below the panels.
  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;
  const hasFooter = showToolbarNavigation || hasBottomActions || !!actions;
  // With a label the box has a card header, and the toolbar belongs in it like on any other box.
  // Without one there is no header to put it in, so it stays in the tab strip's own header, to the
  // right of the tabs. The buttons are `small` either way, consistent with every box header.
  const inCardHeader = Boolean(card && label);
  const toolbarButtons = hasToolbarActions ? (
    <SchemaButtons
      size={'small'}
      variant="contained"
      maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
      iconOnly="sm"
      descriptors={schema.toolbarActions}
    />
  ) : undefined;
  const headerActions = inCardHeader ? toolbarButtons : undefined;
  const tabStripActions = inCardHeader ? undefined : toolbarButtons;
  const footerLeft = showToolbarNavigation ? (
    <PrevButton
      disabled={activeBoxIndex <= 0}
      onClick={() => goToTab(schemaBoxes[activeBoxIndex - 1])}
    />
  ) : undefined;
  const footerRight =
    showToolbarNavigation || hasBottomActions ? (
      <>
        {showToolbarNavigation && (
          <NextButton
            disabled={activeBoxIndex >= schemaBoxes.length - 1}
            onClick={() => goToTab(schemaBoxes[activeBoxIndex + 1])}
          />
        )}
        {hasBottomActions && (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        )}
      </>
    ) : (
      actions
    );

  // Without a card the tab box is a bare layout, not a box surface: the tab bar and panels sit
  // directly on the page background and each inner box (Photos, Location, …) owns its own surface.
  // The tab bar carries no separator of its own — the active-tab indicator is the only affordance.
  const content = (
    <Box sx={{display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0}}>
      <ParentBoxProvider value={parentBoxValue}>
        <NavigationHeader actions={tabStripActions}>
          <Tabs
            value={currentBox.name}
            onChange={handleChange}
            variant="scrollable"
            // `auto`: no scroll buttons until the strip overflows, so tabs that fit get none. When it
            // does overflow MUI mounts both arrows and greys the direction that can't scroll (theme
            // `MuiTabs` scroll-button override) instead of hiding it, so the pair stays put as you
            // scroll rather than one arrow popping in and out.
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {schemaBoxes.map((box, index) => (
              <SchemaBoxTab key={index} value={box.name} schema={box} />
            ))}
          </Tabs>
        </NavigationHeader>
        {schemaBoxes.map((box, index) => (
          <SchemaTabBoxPanel
            key={box.name}
            box={box}
            index={index}
            isActive={currentBox.name === box.name}
            readOnly={readOnly}
            parentBoxName={parentBoxName}
            parentBoxSchema={schema}
            isHidden={isHidden}
            excludeFields={excludeFields}
            childIsRoot={childIsRoot}
            fill={isLast}
            getBoxName={getBoxName}
            inactiveTabsMounted={inactiveTabsMounted}
          />
        ))}
      </ParentBoxProvider>
      {hasFooter && <SectionFooter left={footerLeft} right={footerRight} sx={{mt: 2}} />}
    </Box>
  );

  if (!card) return content;

  // Asked for a surface, the tab box renders like any other box: a card carrying the label in its
  // header. The tab bar, its toolbar and the footer stay inside it — the header is the label only.
  return (
    <BoxLayout
      schema={schema}
      card
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      action={headerActions}
      fullHeight={isLast}
    >
      {content}
    </BoxLayout>
  );
};
