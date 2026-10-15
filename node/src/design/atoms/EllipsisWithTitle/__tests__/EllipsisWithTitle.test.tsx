import React, {useState} from 'react';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {EllipsisWithTitle} from '../EllipsisWithTitle';

// ---------------------------------------------------------------------------
// `DetectableOverflow` decides whether to show the tooltip by reading
// `offsetWidth`/`scrollWidth`, which forces a synchronous layout. Counting reads of
// `scrollWidth` therefore counts reflows - and one of these sits behind every
// ellipsized label, so a reflow per unrelated render is what has to stay away.
// ---------------------------------------------------------------------------

let reads = 0;
// jsdom defines `scrollWidth` on `Element.prototype`, so shadowing it here leaves nothing to
// restore - removing the shadow lets the inherited getter show through again.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    get() {
      reads += 1;
      return 0;
    },
    configurable: true,
  });
});

afterAll(() => {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
});

beforeEach(() => {
  reads = 0;
});

const Harness = ({label}: {label: string}) => {
  const [tick, setTick] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setTick((value) => value + 1)}>
        bump {tick}
      </button>
      <EllipsisWithTitle>{label}</EllipsisWithTitle>
    </>
  );
};

const bump = () => fireEvent.click(screen.getByRole('button', {name: /bump/}));

describe('EllipsisWithTitle', () => {
  it('does not re-measure when its parent re-renders for an unrelated reason', () => {
    render(<Harness label="A stable label that never changes" />);
    const afterMount = reads;

    bump();
    bump();
    bump();

    expect(reads).toBe(afterMount);
  });

  it('re-measures when the label text changes', () => {
    const {rerender} = render(<Harness label="Short" />);
    const afterMount = reads;

    rerender(<Harness label="A considerably longer label that would clip" />);

    expect(reads).toBeGreaterThan(afterMount);
  });
});
