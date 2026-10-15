import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {BoxSchema, FieldDescriptor} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaGridBox} from '../SchemaGridBox';

// The grid's children are stubbed: the assertions are about which box the root-card default lands
// on, not about what the children render.
vi.mock('@schema/components/boxes/SchemaBox', () => ({
  SchemaBoxBody: ({schema, isRoot}: {schema: BoxSchema; isRoot?: boolean}) => (
    <div data-testid={schema.name} data-root={String(Boolean(isRoot))} />
  ),
}));

vi.mock('@schema/components/boxes/SchemaBoxChildren', () => ({
  SchemaFieldGroup: () => <div data-testid={'fields'} />,
}));

// Conditional rendering reads the view schema, which a box-level test does not mount.
vi.mock('@schema/components/dynamic/DynamicRenderWrapper', () => ({
  DynamicRenderWrapper: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

const box = (name: string, over: Partial<BoxSchema> = {}): BoxSchema => ({
  name,
  type: 'simple',
  readOnly: false,
  ...over,
});

const field = (name: string): FieldDescriptor => ({type: 'field', name});

const grid = (boxes: BoxSchema['boxes'], over: Partial<BoxSchema> = {}): BoxSchema => ({
  ...box('layout', {type: 'grid', boxes}),
  ...over,
});

const renderGrid = (schema: BoxSchema, label?: false) => {
  return render(<SchemaGridBox schema={schema} isRoot label={label} />, {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
    ),
  });
};

const rootFlag = (name: string) => screen.getByTestId(name).getAttribute('data-root');

describe("SchemaGridBox as the view's root box", () => {
  it('draws no card and hands the default to its cells when it only wraps boxes', () => {
    const {container} = renderGrid(grid([box('address'), box('photos')]));

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(rootFlag('address')).toBe('true');
    expect(rootFlag('photos')).toBe('true');
  });

  it('keeps the card when it holds fields of its own, so the cells are no longer a root', () => {
    const {container} = renderGrid(grid([field('price'), box('photos')]));

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(rootFlag('photos')).toBe('false');
  });

  it('stops the hand-down when it draws a card for a reason of its own', () => {
    const {container} = renderGrid(grid([box('address')], {label: 'Layout'}));

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(rootFlag('address')).toBe('false');
  });

  // A tab step renders with `label={false}` — its label is already the tab title. The grid honours
  // that like every other box, so it neither repeats the heading nor takes the card for it.
  it('ignores the schema label when the parent passes none, and hands the default on', () => {
    const {container} = renderGrid(grid([box('address')], {label: 'Layout'}), false);

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(screen.queryByText('Layout')).not.toBeInTheDocument();
    expect(rootFlag('address')).toBe('true');
  });

  it('never draws the card when the schema turns it off', () => {
    const {container} = renderGrid(grid([field('price')], {card: false}));

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
  });
});
