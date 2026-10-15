import React, {useEffect, useMemo, useState} from 'react';
import {useRecordContext} from 'react-admin';
import {useFormContext} from 'react-hook-form';
import {DynamicText} from '@admin/components/common/DynamicText';
import {FormStatusLabel} from '@admin/components/common/FormStatusLabel';
import {NextButton} from '@admin/components/common/NextButton';
import {PrevButton} from '@admin/components/common/PrevButton';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {NavigationHeader} from '@design/molecules/NavigationHeader';
import {SectionFooter} from '@design/molecules/SectionFooter';
import {useTabBox} from '@foundation/hooks/useTabsLocation';
import {Box, Step, StepButton, Stepper} from '@mui/material';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {useParentBoxContext} from '@schema/contexts/ParentBoxContext';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {BoxItem, BoxSchema, BoxType, FieldDescriptor} from '@schema/types';
import {isBoxSchema} from '@schema/utils/api';
import {SchemaWizardBoxStep} from './SchemaWizardBoxStep';

const LAYOUT_BOX_TYPES: BoxType[] = ['simple', 'tab', 'tab-item', 'wizard', 'grid', 'grid-item'];

const collectFieldNames = (items: BoxItem[], prefix = ''): string[] => {
  const path = (name: string) => (prefix ? `${prefix}.${name}` : name);
  return items.flatMap((item) => {
    if (!isBoxSchema(item)) return [path((item as FieldDescriptor).name)];
    if (LAYOUT_BOX_TYPES.includes(item.type)) return collectFieldNames(item.boxes || [], prefix);
    if (item.type === 'object' && item.object?.target)
      return collectFieldNames(item.boxes || [], path(item.object.target));
    if (item.type === 'array' && item.array?.target) return [path(item.array.target)];
    return []; // list, gallery — not form fields
  });
};

// The wizard's toolbar actions render as `small` buttons, like every other box header, wherever they
// land — the card header or the stepper's own header. Kept out of the component body so it stays
// within its complexity budget.
const renderToolbarButtons = (schema: BoxSchema): React.ReactNode =>
  schema.toolbarActions?.length ? (
    <SchemaButtons
      size={'small'}
      variant="contained"
      maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
      iconOnly="sm"
      descriptors={schema.toolbarActions}
    />
  ) : undefined;

export const SchemaWizardBoxContent = ({schema, isRoot, label = schema.label}: SchemaBoxProps) => {
  const {showToolbarNavigation = true, validateSteps = true} = schema.wizard ?? {};
  const isLast = useIsLastPanel();
  // Card evaluation as on the grid box, minus the toolbar: a label or `collapsible` turn the card
  // on and an explicit `card` wins both ways, but toolbar actions do not — they live next to the
  // stepper, not in a card header. The root-box default is never kept here either: a wizard renders
  // box children only (fields are filtered out below), so it holds nothing that would need the
  // surface, and the default travels on to the step.
  const card = useBoxCard(schema, Boolean(label || schema.collapsible), false);
  // A card is the surface the steps sit on, so they are no longer a root.
  const childIsRoot = Boolean(isRoot && !card);
  // `DynamicBoxSchemaComponentWrapper` has already dropped the steps whose `showQuery` is false, so
  // each one renders through `SchemaBoxBody` rather than `SchemaBox`, which would check it again.
  const schemaBoxes = useMemo(() => (schema.boxes || []).filter(isBoxSchema), [schema.boxes]);
  const {getBoxName, isHidden} = useParentBoxContext();
  const formContext = useFormContext();
  const formTrigger = formContext?.trigger;
  const record = useRecordContext();
  const hasRecord = record !== undefined;
  const {readOnly} = useViewSchemaContext();

  const parentBoxName = getBoxName(schema.name);
  // Claims the path for as long as the wizard is on screen - see `useTabBox`.
  const {activeTab, setTab} = useTabBox(parentBoxName);

  const activeBoxIndex = (() => {
    const idx = schemaBoxes.findIndex((box) => box.name === activeTab);
    return idx !== -1 ? idx : 0;
  })();

  const [maxVisitedStepIndex, setMaxVisitedStepIndex] = useState(0);
  // In edit/show view a record exists, so all steps are immediately accessible.
  // When step validation is disabled the user may jump freely between steps as well.
  // Without toolbar navigation there is no Next button to unlock steps, so tab
  // clicking is the only way to move - all steps must be freely accessible.
  // Otherwise (create view with validation) steps unlock in order (maxVisitedStepIndex grows via goToNext).
  const effectiveMaxVisitedStepIndex =
    hasRecord || !validateSteps || !showToolbarNavigation
      ? schemaBoxes.length - 1
      : maxVisitedStepIndex;

  // Set initial tab on mount
  useEffect(() => {
    if (schemaBoxes.length > 0 && !activeTab) {
      setTab(schemaBoxes[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBox: BoxSchema | undefined = schemaBoxes[activeBoxIndex] ?? schemaBoxes[0];
  if (!currentBox) return null;

  const prevBox = schemaBoxes[activeBoxIndex - 1];
  const nextBox = schemaBoxes[activeBoxIndex + 1];
  const isLastStep = !nextBox;

  const handleStepClick = (index: number) => {
    const box = schemaBoxes[index];
    if (box) setTab(box.name);
  };

  const handlePrev = () => {
    if (prevBox) setTab(prevBox.name);
  };

  const handleNext = async () => {
    const fieldNames = collectFieldNames(currentBox.boxes || []);
    let valid = true;
    if (validateSteps && formTrigger) {
      valid = await formTrigger(fieldNames.length > 0 ? fieldNames : undefined);
    }
    if (!valid) return;
    if (nextBox) {
      setTab(nextBox.name);
      setMaxVisitedStepIndex((prev) => Math.max(prev, activeBoxIndex + 1));
    }
  };

  // With a label the box has a card header, and the toolbar belongs in it like on any other box.
  // Without one there is no header to put it in, so it stays in the stepper's own header, to the
  // right of the steps. The buttons are `small` either way, consistent with every box header.
  const inCardHeader = Boolean(card && label);
  const toolbarButtons = renderToolbarButtons(schema);
  const headerActions = inCardHeader ? toolbarButtons : undefined;
  const stepperActions = inCardHeader ? undefined : toolbarButtons;
  const hasBottomActions = !!schema.bottomActions?.length;
  const toolbarActionButtons = hasBottomActions ? (
    <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
  ) : null;

  // Box toolbar: Prev on the left; on the right the Next navigation button and the bottom actions
  // (e.g. Save). Next stays on the last step too, only disabled — the control should not vanish at
  // the end, just stop advancing. The bottom actions sit beside it: on the last step always, and on
  // earlier steps only in edit view (a record already exists), where Save must stay reachable — in
  // create view the steps are completed in order, so Save waits for the last step. Validation runs
  // before advancing.
  const nextButton = showToolbarNavigation ? (
    <NextButton disabled={isLastStep} onClick={handleNext} />
  ) : null;
  const bottomActionsButtons = isLastStep || hasRecord ? toolbarActionButtons : null;
  const toolbarRight =
    nextButton || bottomActionsButtons ? (
      <>
        {nextButton}
        {bottomActionsButtons}
      </>
    ) : null;

  const toolbarLeft = showToolbarNavigation ? (
    <PrevButton disabled={activeBoxIndex <= 0} onClick={handlePrev} />
  ) : null;
  const toolbar =
    toolbarLeft || toolbarRight ? <SectionFooter left={toolbarLeft} right={toolbarRight} /> : null;

  // Flex column: the stepper and toolbar take their natural height and the step
  // content takes the rest, so its height:100% doesn't overflow past them.
  const content = (
    <Box sx={{height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
      <NavigationHeader sx={{mb: 3, flexShrink: 0}} actions={stepperActions}>
        <Stepper activeStep={activeBoxIndex} nonLinear>
          {schemaBoxes.map((box, index) => (
            <Step key={box.name} completed={index < activeBoxIndex}>
              <StepButton
                onClick={() => handleStepClick(index)}
                disabled={index > effectiveMaxVisitedStepIndex}
              >
                {readOnly || !formContext ? (
                  box.label || box.name
                ) : (
                  <FormStatusLabel groupName={`${parentBoxName}.${box.name}`}>
                    {box.label || box.name}
                  </FormStatusLabel>
                )}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </NavigationHeader>
      {/* All steps stay mounted (inactive ones hidden) so every step's inputs
          register with their form group. That lets useFormGroup detect errors
          on any step - including server errors on steps the user isn't viewing -
          exactly like the tab box does. The active step keeps the original
          single-step layout; inactive steps are display:none siblings and take
          no space, so the grid layout is unchanged. */}
      {schemaBoxes.map((box) => (
        <SchemaWizardBoxStep
          key={box.name}
          box={box}
          isActive={box.name === currentBox.name}
          parentBoxName={parentBoxName}
          parentBoxSchema={schema}
          isHidden={isHidden}
          childIsRoot={childIsRoot}
          fill={isLast}
          hasFormContext={!!formContext}
          getBoxName={getBoxName}
        />
      ))}
      {toolbar && <Box sx={{mt: 2, flexShrink: 0}}>{toolbar}</Box>}
    </Box>
  );

  if (!card) return content;

  // Asked for a surface, the wizard renders like any other box: a card carrying the label in its
  // header. The stepper, its toolbar and the footer stay inside it — the header is the label only.
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
