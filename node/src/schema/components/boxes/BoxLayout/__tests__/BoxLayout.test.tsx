import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {BoxSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {BoxLayout} from '../BoxLayout';

// Mock Collapse so open/closed state is testable via DOM presence rather than relying on CSS
// transitions that don't run in jsdom
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    Collapse: ({in: open, children}: {in: boolean; children: React.ReactNode}) =>
      open ? <>{children}</> : null,
  };
});

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const makeSchema = (over: Partial<BoxSchema> = {}): BoxSchema => ({
  name: 'box',
  type: 'simple',
  readOnly: false,
  ...over,
});

const renderBox = (schema: BoxSchema, card = true) =>
  render(
    <BoxLayout schema={schema} card={card}>
      content
    </BoxLayout>,
    {wrapper}
  );

describe('BoxLayout', () => {
  describe('without collapsible', () => {
    it('renders children', () => {
      renderBox(makeSchema());
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('does not render a toggle button', () => {
      renderBox(makeSchema());
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('with collapsible="open"', () => {
    it('renders children visible by default', () => {
      renderBox(makeSchema({collapsible: 'open'}));
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('renders a toggle button', () => {
      renderBox(makeSchema({collapsible: 'open'}));
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('hides content after clicking the toggle button', async () => {
      const user = userEvent.setup();
      renderBox(makeSchema({collapsible: 'open'}));

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('shows content again after toggling twice', async () => {
      const user = userEvent.setup();
      renderBox(makeSchema({collapsible: 'open'}));

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));

      expect(screen.getByText('content')).toBeInTheDocument();
    });
  });

  describe('with collapsible="closed"', () => {
    it('renders children hidden by default', () => {
      renderBox(makeSchema({collapsible: 'closed'}));
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('renders a toggle button', () => {
      renderBox(makeSchema({collapsible: 'closed'}));
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows content after clicking the toggle button', async () => {
      const user = userEvent.setup();
      renderBox(makeSchema({collapsible: 'closed'}));

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('content')).toBeInTheDocument();
    });
  });

  describe('header rendering', () => {
    it('renders the label in the card header', () => {
      render(
        <BoxLayout schema={makeSchema()} card label={'Section title'}>
          content
        </BoxLayout>,
        {wrapper}
      );
      expect(screen.getByText('Section title')).toBeInTheDocument();
    });

    it('renders a header (with toggle) when collapsible but no label', () => {
      renderBox(makeSchema({collapsible: 'open'}));
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('card chrome', () => {
    it('renders a labelled card box as a Card with no Section', () => {
      const {container} = render(
        <BoxLayout schema={makeSchema()} card label={'Address'}>
          content
        </BoxLayout>,
        {wrapper}
      );

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
      expect(container.querySelector('.Section')).not.toBeInTheDocument();
    });

    it('renders a labelled card-less box as a Section header with no card', () => {
      const {container} = render(
        <BoxLayout schema={makeSchema()} card={false} label={'Address'}>
          content
        </BoxLayout>,
        {wrapper}
      );

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(container.querySelector('.SectionHeader')).toBeInTheDocument();
      expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    });

    it('keeps the header actions in a card-less box', () => {
      const {container} = render(
        <BoxLayout
          schema={makeSchema()}
          card={false}
          label={'Address'}
          action={<button>Edit</button>}
        >
          content
        </BoxLayout>,
        {wrapper}
      );

      expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
      expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    });
  });

  describe('footer', () => {
    // A card-less footer has no surface of its own, so without a gap the bottom actions would sit
    // right on the card of the nested box above them.
    it('spaces a card-less footer away from the content above it', () => {
      const {container} = render(
        <BoxLayout schema={makeSchema()} card={false} footerRight={<button>Save</button>}>
          content
        </BoxLayout>,
        {wrapper}
      );

      expect(container.querySelector('.SectionFooter')).toHaveStyle({marginTop: '16px'});
    });

    it('keeps the footer of a card box inside the card', () => {
      const {container} = render(
        <BoxLayout schema={makeSchema()} card footerRight={<button>Save</button>}>
          content
        </BoxLayout>,
        {wrapper}
      );

      expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
      expect(container.querySelector('.SectionFooter')).not.toBeInTheDocument();
    });
  });

  describe('each instance is independent', () => {
    it('collapsing one collapsible box leaves a sibling untouched', async () => {
      const user = userEvent.setup();
      render(
        <>
          <BoxLayout schema={makeSchema({name: 'a', collapsible: 'open'})} card>
            first
          </BoxLayout>
          <BoxLayout schema={makeSchema({name: 'b', collapsible: 'open'})} card>
            second
          </BoxLayout>
        </>,
        {wrapper}
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      expect(screen.queryByText('first')).not.toBeInTheDocument();
      expect(screen.getByText('second')).toBeInTheDocument();
    });
  });
});
