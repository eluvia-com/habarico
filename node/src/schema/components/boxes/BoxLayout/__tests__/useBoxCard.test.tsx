import React from 'react';
import {describe, expect, it} from 'vitest';
import {InsidePanelContextProvider} from '@design/contexts/InsidePanelContext';
import {BoxSchema} from '@schema/types';
import {renderHook} from '@testing-library/react';
import {useBoxCard} from '../useBoxCard';

const makeSchema = (over: Partial<BoxSchema> = {}): BoxSchema => ({
  name: 'box',
  type: 'simple',
  readOnly: false,
  ...over,
});

const resolve = (schema: BoxSchema, {implicit = false, isRoot = false, insidePanel = false} = {}) =>
  renderHook(() => useBoxCard(schema, implicit, isRoot), {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <InsidePanelContextProvider value={insidePanel}>{children}</InsidePanelContextProvider>
    ),
  }).result.current;

describe('useBoxCard', () => {
  describe('explicit card', () => {
    it('renders the card when true, even with no other signal', () => {
      expect(resolve(makeSchema({card: true}))).toBe(true);
    });

    it('renders the card when true inside a panel', () => {
      expect(resolve(makeSchema({card: true}), {insidePanel: true})).toBe(true);
    });

    it('suppresses the card when false, even for a labelled root box', () => {
      expect(resolve(makeSchema({card: false}), {implicit: true, isRoot: true})).toBe(false);
    });
  });

  describe('unset card', () => {
    it('follows the implicit signal', () => {
      expect(resolve(makeSchema(), {implicit: true})).toBe(true);
      expect(resolve(makeSchema(), {implicit: false})).toBe(false);
    });

    it('gives the root box a card on a page', () => {
      expect(resolve(makeSchema(), {isRoot: true})).toBe(true);
    });

    it('leaves the root box card-less inside a dialog / side panel', () => {
      expect(resolve(makeSchema(), {isRoot: true, insidePanel: true})).toBe(false);
    });

    it('leaves a nested box card-less on a page', () => {
      expect(resolve(makeSchema(), {isRoot: false})).toBe(false);
    });

    it('treats null the same as an absent key', () => {
      expect(resolve(makeSchema({card: null}), {isRoot: true})).toBe(true);
      expect(resolve(makeSchema({card: null}), {isRoot: false})).toBe(false);
    });
  });
});
