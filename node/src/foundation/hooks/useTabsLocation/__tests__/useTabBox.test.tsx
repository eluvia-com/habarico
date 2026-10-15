import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TabsLocationProvider} from '../TabsLocationProvider';
import {useTabBox} from '../useTabBox';

const renderA = vi.fn();
const renderB = vi.fn();

const TabBoxA = () => {
  renderA();
  const {activeTab, setTab} = useTabBox('a');
  return (
    <button type="button" onClick={() => setTab('x')}>
      A:{activeTab ?? '-'}
    </button>
  );
};

const TabBoxB = () => {
  renderB();
  const {activeTab} = useTabBox('b');
  return <span>B:{activeTab ?? '-'}</span>;
};

// Every tab/wizard box in a view shares one `TabsStore`, whose `getTabs()` returns a fresh array on
// any `setTab` anywhere in it — subscribing to that array re-renders every box on any switch.
// `useTabBox` derives its snapshot from `getActiveTab(path)`, so only the box whose own value
// changed re-renders. That is what these tests pin.
describe('useTabBox — scoped snapshot', () => {
  it('does not re-render an unrelated tab box when this one switches tabs', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TabsLocationProvider syncWithLocation={false}>
          <TabBoxA />
          <TabBoxB />
        </TabsLocationProvider>
      </MemoryRouter>
    );
    renderA.mockClear();
    renderB.mockClear();

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('A:x')).toBeInTheDocument();
    expect(renderA).toHaveBeenCalled();
    expect(renderB).not.toHaveBeenCalled();
  });
});
