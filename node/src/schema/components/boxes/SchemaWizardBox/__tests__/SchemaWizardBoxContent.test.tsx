import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {IsLastPanelContextProvider} from '@design/contexts/IsLastPanelContext';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {ActionDescriptor, BoxSchema, WizardBoxParameters} from '@schema/types';
import {act, render, screen} from '@testing-library/react';
import {SchemaWizardBoxContent} from '../SchemaWizardBoxContent';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSetTab = vi.hoisted(() => vi.fn());
const mockGetActiveTab = vi.hoisted(() =>
  vi.fn<(name: string) => string | undefined>().mockReturnValue(undefined)
);
const mockTrigger = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockIsHidden = vi.hoisted(() => ({value: false}));
const mockRecord = vi.hoisted(() => ({value: undefined as Record<string, unknown> | undefined}));

// Defined outside the mock factory so the reference is stable across re-renders.
const stableGetBoxName = (name: string) => name;

// `useTabBox` scopes the store to one box: it takes the box path and its `setTab` takes the name
// of a step inside it, composing the full path itself.
vi.mock('@foundation/hooks/useTabsLocation', () => ({
  useTabBox: (path: string) => ({
    activeTab: mockGetActiveTab(path),
    setTab: mockSetTab,
  }),
}));

vi.mock('@schema/contexts/ParentBoxContext', () => ({
  useParentBoxContext: () => ({
    getBoxName: stableGetBoxName,
    isHidden: mockIsHidden.value,
    parentBoxName: undefined,
    parentBoxSchema: undefined,
  }),
  ParentBoxProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({trigger: mockTrigger}),
}));

// Colouring is delegated to the shared FormStatusLabel (same component the tab box uses);
// mock it as a passthrough so these tests focus on wizard structure.
vi.mock('@admin/components/common/FormStatusLabel', () => ({
  FormStatusLabel: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

vi.mock('react-admin', () => ({
  FormGroupContextProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useRecordContext: () => mockRecord.value,
  useTranslate: () => (key: string) => key,
}));

vi.mock('@schema/contexts/ViewSchemaContext/useViewSchemaContext', () => ({
  useViewSchemaContext: () => ({readOnly: false}),
}));

vi.mock('@schema/components/boxes/SchemaBox', () => ({
  SchemaBoxBody: ({schema, isRoot}: {schema: {name: string}; isRoot?: boolean}) => (
    <div data-testid={`box-${schema.name}`} data-root={String(Boolean(isRoot))} />
  ),
}));

vi.mock('@design/atoms/Icon', () => ({
  Icon: () => null,
  IconType: {NavigateBefore: 'NavigateBefore', NavigateNext: 'NavigateNext'},
}));

vi.mock('@schema/components/buttons/SchemaButtons', () => ({
  SchemaButtons: ({descriptors}: {descriptors?: ActionDescriptor[]}) => (
    <div data-testid="toolbar-actions">{descriptors?.map((d) => d.name).join(',')}</div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const saveAction: ActionDescriptor = {name: 'save', action: {type: 'save'}} as ActionDescriptor;

// The stepper header holding the stepper — the toolbar sits here until a card header takes it over.
const stepperRow = (container: HTMLElement) => container.querySelector('.NavigationHeader');

const makeSchema = (opts?: {
  wizard?: WizardBoxParameters;
  bottomActions?: ActionDescriptor[];
  label?: string;
  card?: boolean | null;
  toolbarActions?: ActionDescriptor[];
}): BoxSchema => ({
  name: 'wizard',
  type: 'wizard',
  readOnly: false,
  ...(opts?.wizard ? {wizard: opts.wizard} : {}),
  ...(opts?.bottomActions ? {bottomActions: opts.bottomActions} : {}),
  ...(opts?.label ? {label: opts.label} : {}),
  ...(opts?.card === undefined ? {} : {card: opts.card}),
  ...(opts?.toolbarActions ? {toolbarActions: opts.toolbarActions} : {}),
  boxes: [
    {
      name: 'step0',
      label: 'Step 1',
      type: 'simple',
      readOnly: false,
      boxes: [{type: 'field', name: 'company_name'}],
    },
    {name: 'step1', label: 'Step 2', type: 'simple', readOnly: false, boxes: []},
    {name: 'step2', label: 'Step 3', type: 'simple', readOnly: false, boxes: []},
  ],
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SchemaWizardBoxContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveTab.mockReturnValue(undefined);
    mockTrigger.mockResolvedValue(true);
    mockIsHidden.value = false;
    mockRecord.value = undefined; // default: create view (no record yet)
  });

  describe('Stepper rendering', () => {
    it('renders a step label for each box in the schema', () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('keeps every step mounted so their inputs register for error detection', () => {
      // All steps must stay mounted (inactive ones hidden) so useFormGroup can
      // detect errors on any step, mirroring the tab box.
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByTestId('box-step0')).toBeInTheDocument();
      expect(screen.getByTestId('box-step1')).toBeInTheDocument();
      expect(screen.getByTestId('box-step2')).toBeInTheDocument();
    });

    it('future steps are disabled on initial render', () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      const buttons = screen.getAllByRole('button');
      const step2 = buttons.find((b) => b.textContent?.includes('Step 2'));
      const step3 = buttons.find((b) => b.textContent?.includes('Step 3'));
      expect(step2).toBeDisabled();
      expect(step3).toBeDisabled();
    });
  });

  describe('toolbar navigation (default show_toolbar_navigation = true)', () => {
    it('renders Prev and Next on the first step', () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByText('ra.action.prev')).toBeInTheDocument();
      expect(screen.getByText('ra.action.next')).toBeInTheDocument();
    });

    it('Prev is disabled on the first step', () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByText('ra.action.prev').closest('button')).toBeDisabled();
    });

    it('does not render Prev/Next when show_toolbar_navigation is false', () => {
      render(
        <SchemaWizardBoxContent schema={makeSchema({wizard: {showToolbarNavigation: false}})} />
      );
      expect(screen.queryByText('ra.action.prev')).not.toBeInTheDocument();
      expect(screen.queryByText('ra.action.next')).not.toBeInTheDocument();
    });

    it('makes all steps clickable when show_toolbar_navigation is false', () => {
      render(
        <SchemaWizardBoxContent schema={makeSchema({wizard: {showToolbarNavigation: false}})} />
      );
      const buttons = screen.getAllByRole('button');
      const step2 = buttons.find((b) => b.textContent?.includes('Step 2'));
      const step3 = buttons.find((b) => b.textContent?.includes('Step 3'));
      expect(step2).not.toBeDisabled();
      expect(step3).not.toBeDisabled();
    });
  });

  describe('toolbar actions on the last step', () => {
    it('keeps a disabled Next alongside the toolbar actions on the last step', () => {
      mockGetActiveTab.mockReturnValue('step2');
      render(<SchemaWizardBoxContent schema={makeSchema({bottomActions: [saveAction]})} />);
      expect(screen.getByTestId('toolbar-actions')).toHaveTextContent('save');
      // Next is not removed on the last step, only disabled — the control stays visible.
      expect(screen.getByText('ra.action.next').closest('button')).toBeDisabled();
    });

    it('shows a disabled Next on the last step even without toolbar actions', () => {
      mockGetActiveTab.mockReturnValue('step2');
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByText('ra.action.next').closest('button')).toBeDisabled();
    });

    it('does not render toolbar actions on earlier steps in create view', () => {
      mockGetActiveTab.mockReturnValue('step0');
      render(<SchemaWizardBoxContent schema={makeSchema({bottomActions: [saveAction]})} />);
      expect(screen.queryByTestId('toolbar-actions')).not.toBeInTheDocument();
      expect(screen.getByText('ra.action.next')).toBeInTheDocument();
    });

    it('renders toolbar actions on earlier steps in edit view (record exists)', () => {
      mockRecord.value = {id: 1}; // edit view: a record already exists
      mockGetActiveTab.mockReturnValue('step0');
      render(<SchemaWizardBoxContent schema={makeSchema({bottomActions: [saveAction]})} />);
      // Save is reachable from the first step...
      expect(screen.getByTestId('toolbar-actions')).toHaveTextContent('save');
      // ...alongside the Next navigation button.
      expect(screen.getByText('ra.action.next')).toBeInTheDocument();
    });
  });

  describe('per-step validation', () => {
    it('calls trigger with field names from the current step on Next', async () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);

      await act(async () => {
        screen.getByText('ra.action.next').closest('button')?.click();
      });

      expect(mockTrigger).toHaveBeenCalledWith(['company_name']);
    });

    it('advances to the next step when validation passes', async () => {
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      mockSetTab.mockClear();

      await act(async () => {
        screen.getByText('ra.action.next').closest('button')?.click();
      });

      expect(mockSetTab).toHaveBeenCalledWith('step1');
    });

    it('does not advance when validation fails', async () => {
      mockTrigger.mockResolvedValue(false);
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      mockSetTab.mockClear();

      await act(async () => {
        screen.getByText('ra.action.next').closest('button')?.click();
      });

      expect(mockSetTab).not.toHaveBeenCalledWith('step1');
    });
  });

  describe('validateSteps disabled', () => {
    it('does not call trigger on Next', async () => {
      render(<SchemaWizardBoxContent schema={makeSchema({wizard: {validateSteps: false}})} />);

      await act(async () => {
        screen.getByText('ra.action.next').closest('button')?.click();
      });

      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it('still advances to the next step', async () => {
      render(<SchemaWizardBoxContent schema={makeSchema({wizard: {validateSteps: false}})} />);
      mockSetTab.mockClear();

      await act(async () => {
        screen.getByText('ra.action.next').closest('button')?.click();
      });

      expect(mockSetTab).toHaveBeenCalledWith('step1');
    });

    it('all steps are accessible from the start', () => {
      render(<SchemaWizardBoxContent schema={makeSchema({wizard: {validateSteps: false}})} />);
      const buttons = screen.getAllByRole('button');
      const step3 = buttons.find((b) => b.textContent?.includes('Step 3'));
      expect(step3).not.toBeDisabled();
    });
  });

  describe('Prev navigation', () => {
    it('goes to the previous step', () => {
      mockGetActiveTab.mockReturnValue('step1');
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      mockSetTab.mockClear();

      screen.getByText('ra.action.prev').closest('button')?.click();

      expect(mockSetTab).toHaveBeenCalledWith('step0');
    });
  });

  describe('nested wizard', () => {
    it('still renders its stepper content and does not warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<SchemaWizardBoxContent schema={makeSchema()} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // The wizard evaluates `card` like the grid box minus the toolbar: a label or `collapsible` turn
  // the surface on, an explicit value wins both ways, toolbar actions do not (they sit next to the
  // stepper), and the root-box default is handed to the step whenever no card is drawn.
  describe('card and label', () => {
    const themed = ({children}: {children: React.ReactNode}) => (
      <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
    );

    const renderWizard = (schema: BoxSchema) =>
      render(<SchemaWizardBoxContent schema={schema} isRoot />, {wrapper: themed});

    it('renders card-less and hands the root default to the step by default', () => {
      const {container} = renderWizard(makeSchema());

      expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
      expect(screen.getByTestId('box-step0').getAttribute('data-root')).toBe('true');
    });

    it('draws the card with its label in the header, and the step is no longer a root', () => {
      const {container} = renderWizard(makeSchema({label: 'Registration'}));

      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
      expect(screen.getByText('Registration')).toBeInTheDocument();
      expect(screen.getByTestId('box-step0').getAttribute('data-root')).toBe('false');
    });

    it('renders as before when the card is turned off, label included', () => {
      const {container} = renderWizard(makeSchema({label: 'Registration', card: false}));

      expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
      expect(screen.queryByText('Registration')).not.toBeInTheDocument();
      expect(screen.getByTestId('box-step0').getAttribute('data-root')).toBe('true');
    });

    it('keeps toolbar actions next to the stepper without drawing a card for them', () => {
      const {container} = renderWizard(makeSchema({toolbarActions: [saveAction]}));

      expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
      expect(stepperRow(container)?.contains(screen.getByTestId('toolbar-actions'))).toBe(true);
    });

    it('moves the toolbar into the card header once the box has a label', () => {
      const {container} = renderWizard(
        makeSchema({label: 'Registration', toolbarActions: [saveAction]})
      );

      const toolbar = screen.getByTestId('toolbar-actions');
      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
      expect(stepperRow(container)?.contains(toolbar)).toBe(false);
      expect(toolbar).toBeInTheDocument();
    });
  });
});

// The active step's box grows to the wizard's height on the last path, like the active tab of a
// tab box — so a form in a step is as tall as the panel beside it.
describe('SchemaWizardBoxContent step height', () => {
  const renderWithLast = (isLast: boolean) =>
    render(
      <IsLastPanelContextProvider value={isLast}>
        <SchemaWizardBoxContent schema={makeSchema()} isRoot />
      </IsLastPanelContextProvider>,
      {
        wrapper: ({children}: {children: React.ReactNode}) => (
          <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
        ),
      }
    );

  it('stretches the active step box when the wizard is last on its path', () => {
    renderWithLast(true);

    expect(screen.getByTestId('box-step0')).toHaveStyle({flexGrow: '1'});
  });

  it('keeps the active step box at its natural height otherwise', () => {
    renderWithLast(false);

    expect(screen.getByTestId('box-step0')).not.toHaveStyle({flexGrow: '1'});
  });
});
