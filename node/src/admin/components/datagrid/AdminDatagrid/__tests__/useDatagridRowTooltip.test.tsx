import React from 'react';
import {RaRecord} from 'react-admin';
import {createPortal} from 'react-dom';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ACTIONS_COLUMN_CLASS} from '@admin/components/datagrid/StyledDatagrid/constants';
import {TOOLTIP_ENTER_DELAY} from '@admin/constants';
import {act, fireEvent, render, renderHook, screen} from '@testing-library/react';
import {useDatagridRowTooltip} from '../useDatagridRowTooltip';

const record: RaRecord = {id: 1};

// Builds the DOM the hook branches on: a row whose last cell is the actions column, and a dialog in a
// tree of its own. Only one property matters to `contains` — that the dialog is not under the row —
// and a detached tree carries it exactly as `document.body` does. The suite at the bottom of this
// file renders the real thing, portal included, so nothing here has to stand in for that.
const buildDom = () => {
  const table = document.createElement('table');
  const row = document.createElement('tr');
  const contentCell = document.createElement('td');
  const contentText = document.createElement('span');
  // A reference chip: MUI renders a clickable `Chip` as a `role="button"` div, with the label in a
  // span of its own — which is what the pointer is actually over.
  const chip = document.createElement('div');
  chip.setAttribute('role', 'button');
  const chipLabel = document.createElement('span');
  chip.appendChild(chipLabel);
  const actionsCell = document.createElement('td');
  actionsCell.className = `RaDatagrid-rowCell ${ACTIONS_COLUMN_CLASS}`;
  const actionButton = document.createElement('button');

  contentCell.append(contentText, chip);
  actionsCell.appendChild(actionButton);
  row.append(contentCell, actionsCell);
  table.appendChild(row);

  // The dialog a row action opens: a React descendant of the actions cell, but never a DOM descendant
  // of the row. Its panel is a plain `div` — nothing an interactive-element selector would match.
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  const dialogPanel = document.createElement('div');
  dialog.appendChild(dialogPanel);

  return {row, contentText, chipLabel, actionButton, dialogPanel};
};

// The hook only ever reads `currentTarget` and `target`, so a cast keeps the test free of a full
// synthetic-event stub. `currentTarget` is always the row — that is where `DatagridRow` binds it.
const mouseOverOn = (row: HTMLElement, target: HTMLElement) =>
  ({currentTarget: row, target}) as unknown as React.MouseEvent;

const setup = () => renderHook(() => useDatagridRowTooltip(record, () => 'Row hint')).result;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('useDatagridRowTooltip', () => {
  it('opens after the enter delay when hovering row content', () => {
    const {row, contentText} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    expect(result.current.open).toBe(false);

    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(result.current.open).toBe(true);
  });

  it('never opens while hovering the row actions cell', () => {
    const {row, actionButton} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, actionButton)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));

    expect(result.current.open).toBe(false);
  });

  it('closes when the pointer moves from row content into the actions cell', () => {
    const {row, contentText, actionButton} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(result.current.open).toBe(true);

    act(() => result.current.handleMouseOver(mouseOverOn(row, actionButton)));
    expect(result.current.open).toBe(false);
  });

  // The reported bug: MUI portals the dialog to `document.body`, but React still bubbles its
  // synthetic events along the JSX tree, so hovering a panel inside it reaches the row's handler.
  it('never opens for an event bubbling out of a portaled dialog', () => {
    const {row, dialogPanel} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, dialogPanel)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));

    expect(result.current.open).toBe(false);
  });

  it('closes an already-open tooltip when the pointer enters a portaled dialog', () => {
    const {row, contentText, dialogPanel} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(result.current.open).toBe(true);

    act(() => result.current.handleMouseOver(mouseOverOn(row, dialogPanel)));
    expect(result.current.open).toBe(false);
  });

  it('cancels a pending open when the pointer leaves the row', () => {
    const {row, contentText} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    act(() => result.current.handleMouseLeave());
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));

    expect(result.current.open).toBe(false);
  });

  // A click never moves the pointer, so no further mouseover arrives to re-evaluate the target —
  // `mousedown` is the only signal that the row is about to open something on top of itself.
  it('closes on mousedown so a click cannot leave it stranded over a dialog', () => {
    const {row, contentText} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(result.current.open).toBe(true);

    act(() => result.current.handleMouseDown());
    expect(result.current.open).toBe(false);
  });

  // A control in a content cell speaks for itself — a reference chip even names its own action in a
  // tooltip, so the row hint on top of it made two tooltips at once (and promised the row's action
  // rather than the chip's).
  it('does not open over a control that owns its own click', () => {
    const {row, chipLabel} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, chipLabel)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));

    expect(result.current.open).toBe(false);
  });

  // Moving from cell text onto the chip has to *close* the hint, not merely fail to open it. This is
  // why the decision lives here and not in a control that stops the event: a swallowed `mouseover`
  // would never reach this handler, and the hint already on screen would simply stay there.
  it('closes an already-open tooltip when the pointer moves onto such a control', () => {
    const {row, contentText, chipLabel} = buildDom();
    const result = setup();

    act(() => result.current.handleMouseOver(mouseOverOn(row, contentText)));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(result.current.open).toBe(true);

    act(() => result.current.handleMouseOver(mouseOverOn(row, chipLabel)));

    expect(result.current.open).toBe(false);
  });

  it('reports no title when the row has no tooltip function', () => {
    const {result} = renderHook(() => useDatagridRowTooltip(record, undefined));
    expect(result.current.tooltipTitle).toBeNull();
  });
});

// The suite above feeds the handler a hand-built event, which only proves the branching. This one
// proves the wiring the branching rests on: that `currentTarget` really is the `<tr>` (React assigns
// it per listener in `executeDispatch` — `event.currentTarget = currentTarget` before the call, and
// back to `null` after, which is why the check has to stay synchronous), and that an event raised
// inside a portal genuinely reaches a row-level React handler while sitting outside the row in the DOM.
describe('useDatagridRowTooltip — real DOM wiring', () => {
  const RowUnderTest = () => {
    const {open, handleMouseOver} = useDatagridRowTooltip(record, () => 'Row hint');
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>content</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            <tr onMouseOver={handleMouseOver} data-testid={'row'}>
              <td>
                <span data-testid={'content'}>cell text</span>
              </td>
              <td className={`RaDatagrid-rowCell ${ACTIONS_COLUMN_CLASS}`}>
                <button data-testid={'action'}>edit</button>
                {/* Where MUI puts a row action's dialog: inside this cell in JSX, on `body` in the DOM. */}
                {createPortal(
                  <div role={'dialog'}>
                    <div data-testid={'panel'}>panel</div>
                  </div>,
                  document.body
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <output data-testid={'state'}>{open ? 'open' : 'closed'}</output>
      </>
    );
  };

  const state = () => screen.getByTestId('state').textContent;

  it('binds the handler to the row, and the dialog panel lives outside it', () => {
    render(<RowUnderTest />);
    const row = screen.getByTestId('row');

    expect(row.tagName).toBe('TR');
    expect(row.contains(screen.getByTestId('content'))).toBe(true);
    expect(row.contains(screen.getByTestId('panel'))).toBe(false);
  });

  it('opens on real row content and closes on a real event out of the portal', () => {
    render(<RowUnderTest />);

    fireEvent.mouseOver(screen.getByTestId('content'));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(state()).toBe('open');

    // Reaches the row's handler through the React tree, though the DOM says it is elsewhere.
    fireEvent.mouseOver(screen.getByTestId('panel'));
    expect(state()).toBe('closed');
  });

  it('never opens from a real event on the actions cell', () => {
    render(<RowUnderTest />);

    fireEvent.mouseOver(screen.getByTestId('action'));
    act(() => vi.advanceTimersByTime(TOOLTIP_ENTER_DELAY));
    expect(state()).toBe('closed');
  });
});
