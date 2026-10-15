import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {ActionButton} from '../ActionButton';

vi.mock('react-admin', () => ({
  useTranslate: () => (key: string, options?: {_?: string}) => options?._ ?? key,
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

describe('ActionButton', () => {
  it('renders a small button at the in-row height, the default one at 36', () => {
    const {rerender} = render(<ActionButton label={'Mark paid'} size={'small'} />, {wrapper});
    expect(getComputedStyle(screen.getByRole('button')).minHeight).toBe('28px');

    rerender(<ActionButton label={'Mark paid'} />);
    expect(getComputedStyle(screen.getByRole('button')).minHeight).toBe('36px');
  });

  it('sizes the icon-button surface through the same prop', () => {
    render(<ActionButton label={'Mark paid'} surface={'iconButton'} size={'small'} />, {wrapper});
    expect(screen.getByRole('button')).toHaveClass('MuiIconButton-sizeSmall');
  });
});
