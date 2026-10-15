import React, {useState} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {BoxSchema} from '@schema/types';
import {fireEvent, render, screen} from '@testing-library/react';
import {SchemaGridBox} from '../SchemaGridBox';

// ---------------------------------------------------------------------------
// A scaled cell gets its own `PropertyListContext` value through
// `LabelWidthOverride`. That value has to stay referentially stable across a
// re-render of the grid that changes nothing, or every property row inside the
// cell re-renders - `computeLabelWidth` returns a fresh object per call, so the
// whole derivation has to be memoized for the override's own memo to hold.
// ---------------------------------------------------------------------------

type Probe = {commits: number; scaled: boolean; values: Set<unknown>};
const probe = (): Probe => (globalThis as unknown as {__probe: Probe}).__probe;
(globalThis as unknown as {__probe: Probe}).__probe = {
  commits: 0,
  scaled: false,
  values: new Set(),
};

vi.mock('@schema/components/dynamic/DynamicRenderWrapper', () => ({
  DynamicRenderWrapper: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

vi.mock('@schema/components/boxes/SchemaBox', () => ({
  SchemaBoxBody: ({schema}: {schema: BoxSchema}) => <div data-testid={schema.name} />,
}));

// Mirrors the real shape: a memoized cell whose inner `PropertyList` is the context consumer.
vi.mock('@schema/components/boxes/SchemaBoxChildren', async () => {
  const React2 = await import('react');
  const {PropertyListContext} = await import('@design/molecules/PropertyList/PropertyListContext');
  const Consumer = () => {
    const context = React2.useContext(PropertyListContext);
    React2.useEffect(() => {
      const state = (globalThis as unknown as {__probe: Probe}).__probe;
      state.commits += 1;
      state.values.add(context);
      if (context?.labelWidth) state.scaled = true;
    });
    return <div data-testid="fields" />;
  };
  return {SchemaFieldGroup: React2.memo(() => <Consumer />)};
});

// The carded box comes first so it becomes the reference cell; the bare fields cell then differs in
// padding and is the one that actually gets a scaled label width.
const SCHEMA: BoxSchema = {
  name: 'layout',
  type: 'grid',
  readOnly: false,
  boxes: [
    {name: 'side', type: 'simple', readOnly: false, label: 'Side'} as never,
    {type: 'field', name: 'title'} as never,
  ],
};

const Harness = () => {
  const [tick, setTick] = useState(0);
  return (
    <ThemeProvider theme={createLightTheme()}>
      <button type="button" onClick={() => setTick((value) => value + 1)}>
        bump {tick}
      </button>
      <SchemaGridBox schema={SCHEMA} isRoot />
    </ThemeProvider>
  );
};

const bump = () => fireEvent.click(screen.getByRole('button', {name: /bump/}));

beforeEach(() => {
  const state = probe();
  state.commits = 0;
  state.scaled = false;
  state.values = new Set();
});

describe('SchemaGridBox label width', () => {
  it('keeps a scaled cell on one context value across unrelated re-renders', () => {
    render(<Harness />);
    // Guards the test itself: without a scaled cell there is no provider and nothing to measure.
    expect(probe().scaled).toBe(true);
    const afterMount = probe().commits;

    bump();
    bump();
    bump();

    expect(probe().commits).toBe(afterMount);
    expect(probe().values.size).toBe(1);
  });
});
