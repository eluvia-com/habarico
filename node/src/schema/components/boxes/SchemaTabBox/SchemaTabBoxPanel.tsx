import React, {useMemo} from 'react';
import {FormGroupContextProvider} from 'react-admin';
import {Box} from '@mui/material';
import {SchemaBoxBody} from '@schema/components/boxes/SchemaBox';
import {ParentBoxProvider} from '@schema/contexts/ParentBoxContext';
import {BoxSchema} from '@schema/types';
import {SchemaTabPanelRoot} from './SchemaTabBoxRoot';
import {SchemaTabPanel} from './SchemaTabPanel';

type SchemaTabBoxPanelProps = {
  box: BoxSchema;
  index: number;
  isActive: boolean;
  readOnly: boolean;
  parentBoxName: string;
  parentBoxSchema: BoxSchema;
  isHidden: boolean;
  excludeFields?: string[];
  childIsRoot: boolean;
  fill: boolean;
  getBoxName: (name: string) => string;
  // Edit mode only — see `SchemaTabBoxContent`: `false` until the active tab's first commit, then
  // `true` for the rest of this mount's lifetime, so an inactive tab mounts once and stays mounted.
  inactiveTabsMounted: boolean;
};

/**
 * One tab's panel — `box`, `isActive` and the rest are the only things that decide what this panel
 * renders, so wrapping it in `React.memo` (and memoizing the `ParentBoxProvider` value below, which
 * doesn't memoize its own) means switching tabs only re-renders the tab being switched to and the
 * one being switched away from, not every other tab still mounted behind them. Before this, every
 * `ParentBoxProvider` in the tab list got a fresh `value` object on every render of the surrounding
 * `SchemaTabBoxContent` — which happens on every tab switch — so a context change doesn't stop at a
 * `React.memo` boundary the same way a prop change does, and every mounted tab's whole subtree paid
 * for the switch, not just the one moving.
 */
const SchemaTabBoxPanelComponent = ({
  box,
  index,
  isActive,
  readOnly,
  parentBoxName,
  parentBoxSchema,
  isHidden,
  excludeFields,
  childIsRoot,
  fill,
  getBoxName,
  inactiveTabsMounted,
}: SchemaTabBoxPanelProps) => {
  const parentBoxValue = useMemo(
    () => ({parentBoxName, parentBoxSchema, isHidden: isHidden || !isActive}),
    [parentBoxName, parentBoxSchema, isHidden, isActive]
  );

  if (readOnly) {
    return (
      <Box
        className="SchemaTabBox-Box"
        sx={
          isActive
            ? {display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0}
            : undefined
        }
      >
        <SchemaTabPanel value={box.name} activeValue={isActive ? box.name : ''} index={index}>
          <SchemaTabPanelRoot fill={fill}>
            <ParentBoxProvider value={parentBoxValue}>
              <SchemaBoxBody
                schema={box}
                excludeFields={excludeFields}
                label={false}
                isRoot={childIsRoot}
              />
            </ParentBoxProvider>
          </SchemaTabPanelRoot>
        </SchemaTabPanel>
      </Box>
    );
  }

  return (
    <Box
      sx={
        isActive
          ? {display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0}
          : {display: 'none'}
      }
      className="SchemaTabBox-Box"
    >
      {(isActive || inactiveTabsMounted) && (
        <SchemaTabPanelRoot fill={fill}>
          <FormGroupContextProvider name={getBoxName(`${parentBoxSchema.name}.${box.name}`)}>
            <ParentBoxProvider value={parentBoxValue}>
              <SchemaBoxBody
                schema={box}
                excludeFields={excludeFields}
                label={false}
                isRoot={childIsRoot}
              />
            </ParentBoxProvider>
          </FormGroupContextProvider>
        </SchemaTabPanelRoot>
      )}
    </Box>
  );
};

export const SchemaTabBoxPanel = React.memo(SchemaTabBoxPanelComponent);
