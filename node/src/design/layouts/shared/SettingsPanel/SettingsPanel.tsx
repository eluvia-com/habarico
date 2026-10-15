import React from 'react';
import {FormControlLabel, Switch, ToggleButton, ToggleButtonGroup} from '@mui/material';
import {Icon, IconType} from '../../../atoms/Icon';
import {InspectorField, InspectorPanel, InspectorSection} from '../../../organisms/InspectorPanel';
import {ColorMode, Density, PageWidth, useSettingsContext} from '../../contexts/SettingsContext';
import {
  AppearanceLabels,
  ArrangementLabels,
  SettingsComponentProps,
  SettingsLabels,
  TableLabels,
} from '../../types';
import {resolveSlot} from '../../utils';

// English fallbacks; the admin layer overrides these with translated strings.
const DEFAULT_SETTINGS_LABELS: SettingsLabels = {
  title: 'Application settings',
  subtitle: 'Your preferences for how the app should look and behave',
  reset: 'Reset to defaults',
};
const DEFAULT_APPEARANCE_LABELS: AppearanceLabels = {
  section: 'Appearance',
  colorMode: 'Color mode',
  light: 'Light',
  dark: 'Dark',
  contrastMode: 'Contrast mode',
};
const DEFAULT_ARRANGEMENT_LABELS: ArrangementLabels = {
  section: 'Layout',
  pageWidth: 'Page width',
  pageWidthFull: 'Full',
  pageWidthCentered: 'Centered',
};
const DEFAULT_TABLE_LABELS: TableLabels = {
  section: 'Table',
  stripedRows: 'Striped rows',
  density: 'Density',
  densityCompact: 'Compact',
  densityNormal: 'Normal',
  densityComfortable: 'Comfortable',
};

export type SettingsPanelProps = SettingsComponentProps;

/**
 * The application-settings inspector. Which sections render is driven by the
 * `appearance` / `layout` / `table` slots (presence = shown); each carries its own
 * labels. Values are read/written through `useSettings`, so it stays presentational —
 * persistence and translation live in the admin layer.
 */
export const SettingsPanel = ({
  open,
  onClose,
  labels,
  appearance,
  arrangement,
  table,
}: SettingsPanelProps) => {
  const l = {...DEFAULT_SETTINGS_LABELS, ...labels};
  const appearanceLabels = {...DEFAULT_APPEARANCE_LABELS, ...resolveSlot(appearance)?.labels};
  const arrangementLabels = {...DEFAULT_ARRANGEMENT_LABELS, ...resolveSlot(arrangement)?.labels};
  const tableLabels = {...DEFAULT_TABLE_LABELS, ...resolveSlot(table)?.labels};

  const {
    colorMode,
    setColorMode,
    pageWidth,
    setPageWidth,
    contrastMode,
    setContrastMode,
    stripedRows,
    setStripedRows,
    density,
    setDensity,
    densitySupported,
    resetSettings,
  } = useSettingsContext();

  return (
    <InspectorPanel
      open={open}
      onClose={onClose}
      icon={IconType.Settings}
      title={l.title}
      subtitle={l.subtitle}
      onReset={resetSettings}
      resetLabel={l.reset}
    >
      {appearance && (
        <InspectorSection label={appearanceLabels.section}>
          <InspectorField label={appearanceLabels.colorMode}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size={'small'}
              value={colorMode}
              onChange={(_, v: ColorMode | null) => v && setColorMode(v)}
            >
              <ToggleButton value={'light'}>
                <Icon icon={IconType.LightMode} width={18} sx={{mr: 1}} />
                {appearanceLabels.light}
              </ToggleButton>
              <ToggleButton value={'dark'}>
                <Icon icon={IconType.DarkMode} width={18} sx={{mr: 1}} />
                {appearanceLabels.dark}
              </ToggleButton>
            </ToggleButtonGroup>
          </InspectorField>
          <FormControlLabel
            control={
              <Switch
                size={'small'}
                checked={contrastMode}
                onChange={(e) => setContrastMode(e.target.checked)}
              />
            }
            label={appearanceLabels.contrastMode}
          />
        </InspectorSection>
      )}

      {arrangement && (
        <InspectorSection label={arrangementLabels.section}>
          <InspectorField label={arrangementLabels.pageWidth}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size={'small'}
              value={pageWidth}
              onChange={(_, v: PageWidth | null) => v && setPageWidth(v)}
            >
              <ToggleButton value={'full'}>
                <Icon icon={IconType.WidthWide} width={18} sx={{mr: 1}} />
                {arrangementLabels.pageWidthFull}
              </ToggleButton>
              <ToggleButton value={'centered'}>
                <Icon icon={IconType.WidthNormal} width={18} sx={{mr: 1}} />
                {arrangementLabels.pageWidthCentered}
              </ToggleButton>
            </ToggleButtonGroup>
          </InspectorField>
        </InspectorSection>
      )}

      {table && (
        <InspectorSection label={tableLabels.section}>
          <FormControlLabel
            control={
              <Switch
                size={'small'}
                checked={stripedRows}
                onChange={(e) => setStripedRows(e.target.checked)}
              />
            }
            label={tableLabels.stripedRows}
          />
          {densitySupported && (
            <InspectorField label={tableLabels.density}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size={'small'}
                value={density}
                onChange={(_, v: Density | null) => v && setDensity(v)}
              >
                <ToggleButton value={'compact'}>{tableLabels.densityCompact}</ToggleButton>
                <ToggleButton value={'standard'}>{tableLabels.densityNormal}</ToggleButton>
                <ToggleButton value={'comfortable'}>{tableLabels.densityComfortable}</ToggleButton>
              </ToggleButtonGroup>
            </InspectorField>
          )}
        </InspectorSection>
      )}
    </InspectorPanel>
  );
};
