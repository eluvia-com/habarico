import React from 'react';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {InputAdornment, ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PasswordField} from '../PasswordField';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const label = () => document.querySelector('label.MuiInputLabel-root');

describe('PasswordField', () => {
  it('keeps a slot the caller aims at another part of the field', () => {
    // `inputLabel.shrink` is how MUI is told to lift the label off a value it cannot see for
    // itself. Overwriting `slotProps` wholesale used to drop it, leaving the label over the value.
    render(<PasswordField label={'Password'} slotProps={{inputLabel: {shrink: true}}} />, {
      wrapper,
    });
    expect(label()).toHaveClass('MuiInputLabel-shrink');
  });

  it('shrinks the label on its own once the field holds a value', () => {
    render(<PasswordField label={'Password'} value={'test'} onChange={() => undefined} />, {
      wrapper,
    });
    expect(label()).toHaveClass('MuiInputLabel-shrink');
  });

  it('keeps its visibility toggle beside a caller-supplied adornment, not instead of it', async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        label={'Password'}
        slotProps={{
          input: {endAdornment: <InputAdornment position={'end'}>USD</InputAdornment>},
        }}
      />,
      {wrapper}
    );

    expect(screen.getByText('USD')).toBeInTheDocument();
    const toggle = screen.getByRole('button');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    await user.click(toggle);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});
