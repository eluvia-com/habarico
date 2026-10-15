import React from 'react';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {
  SETTINGS_DEFAULTS,
  SettingsContext,
  SettingsContextState,
} from '../../../contexts/SettingsContext';
import {SettingsPanel} from '../SettingsPanel';

const renderPanel = (densitySupported: boolean) => {
  const value: SettingsContextState = {...SETTINGS_DEFAULTS, densitySupported};
  return render(
    <ThemeProvider theme={createLightTheme()}>
      <SettingsContext.Provider value={value}>
        <SettingsPanel open onClose={() => {}} table />
      </SettingsContext.Provider>
    </ThemeProvider>
  );
};

describe('SettingsPanel — density visibility', () => {
  it('shows the density toggle when the device supports it', () => {
    renderPanel(true);

    expect(screen.getByText('Density')).toBeInTheDocument();
    expect(screen.getByText('Comfortable')).toBeInTheDocument();
  });

  it('hides the density toggle when the device does not support it', () => {
    renderPanel(false);

    expect(screen.queryByText('Density')).not.toBeInTheDocument();
    expect(screen.queryByText('Comfortable')).not.toBeInTheDocument();
    // the rest of the table section (striped rows) still renders
    expect(screen.getByText('Striped rows')).toBeInTheDocument();
  });
});
