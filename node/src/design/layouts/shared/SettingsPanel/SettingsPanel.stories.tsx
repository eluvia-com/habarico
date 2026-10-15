import React, {useMemo, useState} from 'react';
import {Meta, StoryObj} from '@storybook/react-vite';
import {padDecorator} from '../../../_storyKit';
import {
  SETTINGS_DEFAULTS,
  SettingsContext,
  SettingsContextState,
} from '../../contexts/SettingsContext';
import {SettingsPanel} from './SettingsPanel';
import {SettingsToggle} from './SettingsToggle';

const meta: Meta<typeof SettingsPanel> = {
  title: 'design/layouts/shared/SettingsPanel',
  component: SettingsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The application-settings inspector (built on `InspectorPanel`): colour mode, page ' +
          'width, contrast and table density/striping. Reads and writes through `useSettings`, ' +
          'so it is fully presentational — persistence and translation belong to the admin layer. ' +
          'Labels default to English and are overridden with translated strings in the app.',
      },
    },
    controls: {include: ['appearance', 'arrangement', 'table']},
  },
  argTypes: {
    appearance: {control: 'boolean', description: 'Shows the color-mode / contrast section.'},
    arrangement: {control: 'boolean', description: 'Shows the page-width section.'},
    table: {control: 'boolean', description: 'Shows the table density/striping section.'},
  },
  args: {appearance: true, arrangement: true, table: true},
  decorators: [padDecorator],
};

export default meta;

type Story = StoryObj<typeof SettingsPanel>;

/** Local-state settings so the story is interactive without any data layer. */
const useDemoSettings = (densitySupported: boolean): SettingsContextState => {
  const [colorMode, setColorMode] = useState(SETTINGS_DEFAULTS.colorMode);
  const [locale, setLocale] = useState<string | null>(SETTINGS_DEFAULTS.locale);
  const [pageWidth, setPageWidth] = useState(SETTINGS_DEFAULTS.pageWidth);
  const [contrastMode, setContrastMode] = useState(SETTINGS_DEFAULTS.contrastMode);
  const [stripedRows, setStripedRows] = useState(SETTINGS_DEFAULTS.stripedRows);
  const [density, setDensity] = useState(SETTINGS_DEFAULTS.density);
  return useMemo(
    () => ({
      colorMode,
      setColorMode,
      locale,
      setLocale,
      pageWidth,
      setPageWidth,
      contrastMode,
      setContrastMode,
      stripedRows,
      setStripedRows,
      density,
      setDensity,
      densitySupported,
      resetSettings: () => {
        setColorMode(SETTINGS_DEFAULTS.colorMode);
        setPageWidth(SETTINGS_DEFAULTS.pageWidth);
        setContrastMode(SETTINGS_DEFAULTS.contrastMode);
        setStripedRows(SETTINGS_DEFAULTS.stripedRows);
        setDensity(SETTINGS_DEFAULTS.density);
      },
    }),
    [colorMode, locale, pageWidth, contrastMode, stripedRows, density, densitySupported]
  );
};

type SettingsDemoArgs = {appearance: boolean; arrangement: boolean; table: boolean};

const SettingsDemo = ({
  appearance,
  arrangement,
  table,
  densitySupported = true,
}: SettingsDemoArgs & {densitySupported?: boolean}) => {
  const [open, setOpen] = useState(false);
  const settings = useDemoSettings(densitySupported);
  return (
    <SettingsContext.Provider value={settings}>
      <SettingsToggle open={open} onClick={() => setOpen(true)} tooltip={'Settings'} />
      <SettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        appearance={appearance || undefined}
        arrangement={arrangement || undefined}
        table={table || undefined}
      />
    </SettingsContext.Provider>
  );
};

// `render` returns the local `SettingsDemo` helper (it owns the `open` state and the mock
// settings context — see the "Hooks live in a top-level demo component" rule), so "Show code"
// would otherwise show that helper's tag. `docs.source.transform` rebuilds the real composed
// usage from the story's current args instead — reactive, unlike a static `docs.source.code`
// override.
const buildPlaygroundSource = (args: SettingsDemoArgs) => `<SettingsToggle
  open={open}
  onClick={() => setOpen(true)}
  tooltip="Settings"
/>
<SettingsPanel
  open={open}
  onClose={() => setOpen(false)}
  appearance={${args.appearance}}
  arrangement={${args.arrangement}}
  table={${args.table}}
/>`;

/** Interactive instance — toggle sections from Controls, then click the bell to open. */
export const Playground: Story = {
  render: (args) => <SettingsDemo {...(args as unknown as SettingsDemoArgs)} />,
  parameters: {
    docs: {
      source: {
        transform: (_code: string, {args}: {args: SettingsDemoArgs}) => buildPlaygroundSource(args),
      },
    },
  },
};

/**
 * On phones density is locked to compact, so the table section hides the density toggle
 * entirely — only striped rows remains togglable.
 */
export const DensityUnsupported: Story = {
  parameters: {docs: {canvas: {sourceState: 'none'}}},
  render: (_args) => <SettingsDemo appearance arrangement table densitySupported={false} />,
};
