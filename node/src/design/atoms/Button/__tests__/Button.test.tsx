import React from 'react';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render, screen} from '@testing-library/react';
import {Button} from '../Button';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const style = () => getComputedStyle(screen.getByRole('button'));

// 28 is the height of a control that sits inside a row of read data — the line a read
// `PropertyItem` reserves for a `smallField` row, and what MUI's `small` `IconButton` (a list's row
// actions) renders at. A `small` button has to land on it so it sits in the row instead of growing
// it.

describe('Button size', () => {
  it('sizes small to the in-row height, with no vertical padding to grow it', () => {
    render(<Button size={'small'}>{'Mark paid'}</Button>, {wrapper});
    const css = style();
    expect(css.minHeight).toBe('28px');
    expect(css.paddingTop).toBe('0px');
    expect(css.paddingBottom).toBe('0px');
  });

  it('renders a square in-row control when small composes with iconOnly', () => {
    render(
      <Button size={'small'} iconOnly aria-label={'Mark paid'}>
        {'x'}
      </Button>,
      {wrapper}
    );
    const css = style();
    expect(css.minHeight).toBe('28px');
    expect(css.minWidth).toBe('28px');
    expect(css.paddingLeft).toBe('0px');
    expect(css.paddingRight).toBe('0px');
  });

  it('leaves the default (medium) size alone', () => {
    render(<Button>{'Mark paid'}</Button>, {wrapper});
    expect(style().minHeight).toBe('36px');
  });

  it('lets the call site override the size through sx', () => {
    render(
      <Button size={'small'} sx={{minHeight: 40}}>
        {'Mark paid'}
      </Button>,
      {wrapper}
    );
    expect(style().minHeight).toBe('40px');
  });

  it('does not forward iconOnly to the DOM', () => {
    render(
      <Button size={'small'} iconOnly aria-label={'Mark paid'}>
        {'x'}
      </Button>,
      {wrapper}
    );
    expect(screen.getByRole('button')).not.toHaveAttribute('iconOnly');
  });
});
