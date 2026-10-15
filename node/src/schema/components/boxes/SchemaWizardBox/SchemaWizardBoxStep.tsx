import React, {useMemo} from 'react';
import {FormGroupContextProvider} from 'react-admin';
import {Box} from '@mui/material';
import {SchemaBoxBody} from '@schema/components/boxes/SchemaBox';
import {ParentBoxProvider} from '@schema/contexts/ParentBoxContext';
import {BoxSchema} from '@schema/types';

type SchemaWizardBoxStepProps = {
  box: BoxSchema;
  isActive: boolean;
  parentBoxName: string;
  parentBoxSchema: BoxSchema;
  isHidden: boolean;
  childIsRoot: boolean;
  fill: boolean;
  hasFormContext: boolean;
  getBoxName: (name: string) => string;
};

/**
 * One wizard step — wrapped in `React.memo` for the same reason as `SchemaTabBox`'s per-tab panel
 * (`SchemaTabBoxPanel`): all steps stay mounted at once (inactive ones `display: none`, so their
 * inputs stay registered), and `ParentBoxProvider` doesn't memoize its own `value` — a fresh object
 * on every render of the surrounding `SchemaWizardBoxContent` (which happens on every step switch)
 * would otherwise invalidate the context for every mounted step, not just the one moving, and a
 * context change re-renders a `React.memo`'d consumer regardless of its own props.
 */
const SchemaWizardBoxStepComponent = ({
  box,
  isActive,
  parentBoxName,
  parentBoxSchema,
  isHidden,
  childIsRoot,
  fill,
  hasFormContext,
  getBoxName,
}: SchemaWizardBoxStepProps) => {
  const parentBoxValue = useMemo(
    () => ({parentBoxName, parentBoxSchema, isHidden: isHidden || !isActive}),
    [parentBoxName, parentBoxSchema, isHidden, isActive]
  );

  return (
    <Box
      sx={
        isActive
          ? {
              flexGrow: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              ...(fill && {'& > *': {flexGrow: 1}}),
            }
          : {display: 'none'}
      }
    >
      <ParentBoxProvider value={parentBoxValue}>
        {hasFormContext ? (
          <FormGroupContextProvider name={getBoxName(`${parentBoxSchema.name}.${box.name}`)}>
            <SchemaBoxBody schema={box} label={false} isRoot={childIsRoot} />
          </FormGroupContextProvider>
        ) : (
          <SchemaBoxBody schema={box} label={false} isRoot={childIsRoot} />
        )}
      </ParentBoxProvider>
    </Box>
  );
};

export const SchemaWizardBoxStep = React.memo(SchemaWizardBoxStepComponent);
