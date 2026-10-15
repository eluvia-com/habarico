import React from 'react';
import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ListSurface} from '../ListSurface';

describe('ListSurface', () => {
  it('renders the list content without a side panel', () => {
    render(
      <ListSurface>
        <div data-testid="list">list</div>
      </ListSurface>
    );
    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
  });

  it('docks the side panel beside the list content when provided', () => {
    render(
      <ListSurface sidePanel={<div data-testid="panel">panel</div>}>
        <div data-testid="list">list</div>
      </ListSurface>
    );
    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});
