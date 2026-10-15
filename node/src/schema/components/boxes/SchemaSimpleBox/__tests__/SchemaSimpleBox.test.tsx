import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {BoxSchema} from '@schema/types';
import {render, screen} from '@testing-library/react';
import {SchemaSimpleBox} from '../SchemaSimpleBox';

// Children are stubbed: the assertions are about which box the root-card default lands on.
vi.mock('@schema/components/boxes/SchemaBox', () => ({
  SchemaBox: ({schema, isRoot}: {schema: BoxSchema; isRoot?: boolean}) => (
    <div data-testid={schema.name} data-root={String(Boolean(isRoot))} />
  ),
}));

vi.mock('@admin/components/common/DynamicText', () => ({
  DynamicText: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

const box = (name: string, over: Partial<BoxSchema> = {}): BoxSchema => ({
  name,
  type: 'simple',
  readOnly: false,
  ...over,
});

const renderBox = (schema: BoxSchema) =>
  render(<SchemaSimpleBox schema={schema} isRoot />, {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
    ),
  });

const rootFlag = (name: string) => screen.getByTestId(name).getAttribute('data-root');

describe("SchemaSimpleBox as the view's root box", () => {
  it('draws no card and hands the default down when it only wraps boxes', () => {
    const {container} = renderBox(box('wrapper', {boxes: [box('address'), box('photos')]}));

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(rootFlag('address')).toBe('true');
    expect(rootFlag('photos')).toBe('true');
  });

  it('stops the hand-down when it draws a card of its own', () => {
    const {container} = renderBox(
      box('wrapper', {label: 'Detail', boxes: [box('address'), box('photos')]})
    );

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(rootFlag('address')).toBe('false');
  });

  it('hands the default down even when the card is turned off explicitly', () => {
    const {container} = renderBox(
      box('wrapper', {label: 'Detail', card: false, boxes: [box('address')]})
    );

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(rootFlag('address')).toBe('true');
  });
});
