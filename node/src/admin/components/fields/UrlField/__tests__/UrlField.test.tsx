import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {UrlField} from '../UrlField';

const mocks = vi.hoisted(() => ({record: {} as Record<string, unknown>}));

vi.mock('react-admin', () => ({
  useRecordContext: () => mocks.record,
  FunctionField: ({
    render: renderValue,
  }: {
    render: (record: Record<string, unknown>) => unknown;
  }) => <>{renderValue(mocks.record) as React.ReactNode}</>,
}));

describe('UrlField', () => {
  it('renders an http URL as a link that carries no opener', () => {
    mocks.record = {id: 1, website: 'https://example.com/shop'};
    render(<UrlField source={'website'} />);

    const link = screen.getByRole('link', {name: 'https://example.com/shop'});
    expect(link).toHaveAttribute('href', 'https://example.com/shop');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // React neutralises a `javascript:` href itself, but not `data:` or `blob:` — and a link whose
  // href React has rewritten to a `throw` is a worse thing to show than the plain value.
  it('renders an unsafe value as plain text instead of a link', () => {
    mocks.record = {id: 1, website: 'javascript:alert(document.cookie)'};
    render(<UrlField source={'website'} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(document.cookie)')).toBeInTheDocument();
  });

  it('renders the empty text when the record has no value', () => {
    mocks.record = {id: 1};
    render(<UrlField source={'website'} />);

    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
