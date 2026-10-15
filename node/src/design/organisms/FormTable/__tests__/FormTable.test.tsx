import React, {useCallback, useMemo, useState} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {MenuItem, Select} from '@mui/material';
import {ThemeProvider} from '@mui/material';
import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FormTable, type FormTableColumn} from '../FormTable';
import {FORM_WIDTH_REFERENCE_CLASS} from '../constants';

type Row = {v: string};

const columns: FormTableColumn<Row>[] = [{key: 'v', render: (row) => <span>{row.v}</span>}];

// One cell holding every kind of content a row click has to tell apart: plain text (the row's own
// surface), a live control, and the two inert ones the row is allowed to claim.
const clickableColumns: FormTableColumn<Row>[] = [
  {
    key: 'v',
    render: (row) => (
      <>
        <span>{row.v}</span>
        <input aria-label={`live ${row.v}`} />
        <input aria-label={`readonly ${row.v}`} readOnly />
        <input aria-label={`disabled ${row.v}`} disabled />
      </>
    ),
  },
];

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const setupClickable = ({
  canClickRow,
  disabled,
}: {
  canClickRow?: (row: Row, index: number) => boolean;
  disabled?: boolean;
} = {}) => {
  const onRowClick = vi.fn();
  render(
    <FormTable
      value={[{v: 'a'}, {v: 'b'}]}
      onChange={vi.fn()}
      columns={clickableColumns}
      createRow={() => ({v: 'new'})}
      onRowClick={onRowClick}
      canClickRow={canClickRow}
      disabled={disabled}
    />,
    {wrapper}
  );
  return {onRowClick};
};

const setup = (value: Row[], canRemoveRow?: (row: Row, index: number) => boolean) => {
  const onChange = vi.fn();
  render(
    <FormTable
      value={value}
      onChange={onChange}
      columns={columns}
      createRow={() => ({v: 'new'})}
      canRemoveRow={canRemoveRow}
      emptyMessage={'No rows'}
    />,
    {wrapper}
  );
  return {onChange};
};

// jsdom has no layout, so every box measures 0 — which a row reads as "I have no box yet" and
// answers by hiding its content until it knows whether its cells fit side by side (see
// `FormTable — width-driven row layout` at the bottom, which is where that is exercised on purpose).
// Give every row a wide box so the rest of these tests exercise a laid-out, inline table.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1024, 40)
  );
});

afterEach(() => vi.restoreAllMocks());

describe('FormTable', () => {
  it('does not call onChange on render', () => {
    const {onChange} = setup([{v: 'a'}, {v: 'b'}]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('appends a created row on Add', async () => {
    const user = userEvent.setup();
    const {onChange} = setup([{v: 'a'}, {v: 'b'}]);
    await user.click(screen.getByRole('button', {name: 'Add'}));
    expect(onChange).toHaveBeenCalledWith([{v: 'a'}, {v: 'b'}, {v: 'new'}]);
  });

  it('removes the clicked row', async () => {
    const user = userEvent.setup();
    const {onChange} = setup([{v: 'a'}, {v: 'b'}]);
    const deleteButtons = screen.getAllByLabelText('Remove row');
    await user.click(deleteButtons[0]);
    expect(onChange).toHaveBeenCalledWith([{v: 'b'}]);
  });

  it('hides the delete action of a row `canRemoveRow` rejects, keeping its track', () => {
    setup([{v: 'a'}, {v: 'b'}], (row) => row.v !== 'a');
    const [locked, removable] = screen.getAllByLabelText('Remove row');
    // Rendered (so the column keeps its width) but inert and invisible.
    expect(locked).toBeInTheDocument();
    expect(locked).toBeDisabled();
    expect(locked).toHaveStyle({visibility: 'hidden'});
    expect(removable).toBeEnabled();
    expect(removable).not.toHaveStyle({visibility: 'hidden'});
  });

  it('clears all rows from the overflow menu', async () => {
    const user = userEvent.setup();
    const {onChange} = setup([{v: 'a'}, {v: 'b'}]);
    await user.click(screen.getByLabelText('More'));
    await user.click(screen.getByText('Clear all'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows the empty message and no rows when value is empty', () => {
    setup([]);
    expect(screen.getByText('No rows')).toBeInTheDocument();
    expect(screen.queryByLabelText('Remove row')).not.toBeInTheDocument();
  });

  it('renders the count label', () => {
    setup([{v: 'a'}, {v: 'b'}]);
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('calls onRowClick with the row clicked on its own surface', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable();
    await user.click(screen.getByText('b'));
    expect(onRowClick).toHaveBeenCalledWith({v: 'b'}, 1);
  });

  it('leaves a live control its own click', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable();
    await user.click(screen.getByLabelText('live a'));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('leaves the delete button its own click', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable();
    await user.click(screen.getAllByLabelText('Remove row')[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('claims the click of an inert control', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable();
    // Read-only: dispatches its click like any other element, and the row takes it — a read-only
    // cell is a label as far as the user is concerned.
    await user.click(screen.getByLabelText('readonly a'));
    expect(onRowClick).toHaveBeenCalledWith({v: 'a'}, 0);
    // Disabled: `fireEvent`, because a browser dispatches no click on a disabled control at all —
    // the row's `pointer-events: none` is what retargets that click at the row in the first place.
    // What's under test here is the guard letting it through once it arrives.
    fireEvent.click(screen.getByLabelText('disabled b'));
    expect(onRowClick).toHaveBeenCalledWith({v: 'b'}, 1);
  });

  it('ignores a click inside a portal a cell opened', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <FormTable
        value={[{v: 'a'}]}
        onChange={vi.fn()}
        columns={[
          {
            key: 'v',
            render: () => (
              <Select value={'one'} onChange={() => undefined} aria-label={'pick'}>
                <MenuItem value={'one'}>one</MenuItem>
                <MenuItem value={'two'}>two</MenuItem>
              </Select>
            ),
          },
        ]}
        createRow={() => ({v: 'new'})}
        onRowClick={onRowClick}
      />,
      {wrapper}
    );

    // The menu renders in a portal, but a React event still bubbles along the React *tree* — the
    // row must read neither a click on an option nor the backdrop click that dismisses the menu as
    // its own. The option is a control the guard recognises; the backdrop is not, and only the
    // row's DOM containment check keeps that one out.
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', {name: 'two'}));
    expect(onRowClick).not.toHaveBeenCalled();

    await user.click(screen.getByRole('combobox'));
    await user.click(document.querySelector('.MuiBackdrop-root') as HTMLElement);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('ignores a click on a row `canClickRow` rejects', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable({canClickRow: (row) => row.v !== 'a'});
    await user.click(screen.getByText('a'));
    expect(onRowClick).not.toHaveBeenCalled();
    await user.click(screen.getByText('b'));
    expect(onRowClick).toHaveBeenCalledWith({v: 'b'}, 1);
  });

  it('ignores row clicks while the table is disabled', async () => {
    const user = userEvent.setup();
    const {onRowClick} = setupClickable({disabled: true});
    await user.click(screen.getByText('a'));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders column labels as property rows in the stacked layout', () => {
    render(
      <FormTable
        value={[{v: 'a'}]}
        onChange={vi.fn()}
        columns={[{key: 'v', label: 'Value', render: (row) => <span>{row.v}</span>}]}
        createRow={() => ({v: 'new'})}
        inline={false}
      />,
      {wrapper}
    );
    // The stacked layout surfaces each column's `label` (a `PropertyItem`), still rendering its cell.
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });
});

// A form with several array lists re-rendered every row of every list on any unrelated change
// elsewhere in the form (HAB-975) — because `FormTable`'s own `removeAt` was a fresh closure on
// every render, which alone defeated `FormTableRow`'s `React.memo` for every row regardless of
// `columns`/`row` stability. This is the caller-side contract that memo depends on: `value`,
// `columns` and `onChange` must themselves stay referentially stable across an unrelated re-render
// for a row to actually bail — exercised here with a harness that mimics a real caller
// (`FormArrayInput`/`SchemaChoicesFormIterator`, both memoize the same way).
describe('FormTable — row memoization', () => {
  const rowRenders = vi.fn();

  const Harness = () => {
    const [tick, setTick] = useState(0);
    const [value, setValue] = useState<Row[]>([{v: 'a'}, {v: 'b'}]);
    const stableColumns: FormTableColumn<Row>[] = useMemo(
      () => [
        {
          key: 'v',
          render: (row: Row) => {
            rowRenders(row.v);
            return <span>{row.v}</span>;
          },
        },
      ],
      []
    );
    const handleChange = useCallback((next: Row[]) => setValue(next), []);

    return (
      <>
        <button onClick={() => setTick((t) => t + 1)}>tick ({tick})</button>
        <FormTable
          value={value}
          onChange={handleChange}
          columns={stableColumns}
          createRow={() => ({v: 'new'})}
        />
      </>
    );
  };

  it('does not re-render a row when an unrelated ancestor state changes', async () => {
    const user = userEvent.setup();
    rowRenders.mockClear();
    render(<Harness />, {wrapper});

    expect(rowRenders).toHaveBeenCalledWith('a');
    expect(rowRenders).toHaveBeenCalledWith('b');
    rowRenders.mockClear();

    await user.click(screen.getByRole('button', {name: /tick/}));

    expect(rowRenders).not.toHaveBeenCalled();
  });
});

// An `inline` row chooses between two layouts from its own measured width. Two columns need 372px
// side by side (`COLUMN_MIN_WIDTH` + gap each, plus the delete button); below that the cells stack,
// and until the row has been measured at all it shows nothing rather than guess.
describe('FormTable — width-driven row layout', () => {
  const twoColumns: FormTableColumn<Row>[] = [
    {key: 'a', render: (row) => <span>{`${row.v}-a`}</span>},
    {key: 'b', render: (row) => <span>{`${row.v}-b`}</span>},
  ];

  const mockRowWidth = (width: number) =>
    vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, width, 40));

  const table = () => (
    <FormTable
      value={[{v: 'x'}]}
      onChange={vi.fn()}
      columns={twoColumns}
      createRow={() => ({v: 'new'})}
    />
  );

  const renderRow = () => render(table(), {wrapper});

  // Inline, the cells are direct children of the row card — which holds the delete button too.
  // Stacked, they share a wrapper of their own that does not.
  const cellsParent = () => screen.getByText('x-a').parentElement!.parentElement!;
  const deleteButton = () => screen.getByRole('button', {name: 'Remove row', hidden: true});

  // One test swaps in an observer it can fire by hand; put the setup file's no-op stub back after it.
  const stubbedResizeObserver = window.ResizeObserver;
  afterEach(() => {
    window.ResizeObserver = stubbedResizeObserver;
  });

  it('lays the cells out inline when the row is wide enough', () => {
    mockRowWidth(1024);
    renderRow();
    expect(cellsParent()).toContainElement(deleteButton());
    expect(screen.getByText('x-a')).toBeVisible();
  });

  it('stacks the cells of a row measured too narrow to fit them', () => {
    mockRowWidth(100);
    renderRow();
    expect(cellsParent()).not.toContainElement(deleteButton());
    expect(screen.getByText('x-a')).toBeVisible();
  });

  it('hides its content while it has no layout box to measure', () => {
    // A row inside a `display: none` ancestor measures 0 — how an inactive tab panel / wizard step
    // mounts its array lists. Nothing re-renders the row when the panel is revealed (its props
    // don't change, and it is memoized), so whatever arrangement it guessed is what paints; it
    // paints nothing instead, and the observer fills in the real layout a frame later.
    mockRowWidth(0);
    renderRow();
    expect(screen.getByText('x-a')).not.toBeVisible();
    expect(screen.getByText('x-a')).toBeInTheDocument();
  });

  it('keeps the width it last measured when it loses its layout box', () => {
    // Switching to another tab costs the row its box but not its layout: a form does not change width
    // because a tab was switched, so the row comes back with the arrangement it already had rather
    // than an empty card. Only a resize while it is away invalidates that — see the test below.
    mockRowWidth(1024);
    const {rerender} = renderRow();
    expect(screen.getByText('x-a')).toBeVisible();

    mockRowWidth(0);
    rerender(table()); // a fresh `row` object re-runs the measuring effect, as a real re-render does
    expect(screen.getByText('x-a')).toBeVisible();
    expect(cellsParent()).toContainElement(deleteButton());
  });

  it('drops that width when the form is resized while the row has no box', () => {
    // The row's own observer cannot see this: it has no box to report on. The one watching the form
    // container can, and finding the row still boxless is what makes the kept width meaningless —
    // without this the row would come back laid out by a width that stopped being true, and only
    // correct itself a frame after painting.
    const observed: {target: Element; fire: () => void}[] = [];
    class ControllableResizeObserver {
      constructor(private callback: () => void) {}
      observe(target: Element) {
        observed.push({target, fire: () => this.callback()});
      }
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ControllableResizeObserver as unknown as typeof ResizeObserver;

    mockRowWidth(1024);
    const {container} = render(<div className={FORM_WIDTH_REFERENCE_CLASS}>{table()}</div>, {
      wrapper,
    });
    expect(screen.getByText('x-a')).toBeVisible();

    const reference = container.querySelector(`.${FORM_WIDTH_REFERENCE_CLASS}`)!;
    mockRowWidth(0); // the row is on a hidden tab now; the reference still has its box
    // `act`, because this fires the observer callback by hand: the two `setState`s it makes are
    // outside React's own scheduling, so without it the assertion below reads the DOM a render early.
    act(() => observed.find((o) => o.target === reference)!.fire());

    expect(screen.getByText('x-a')).not.toBeVisible();
  });
});
