import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {fireEvent, render, screen} from '@testing-library/react';
import {CustomDialog} from '../CustomDialog';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

// The dialog's DOM is portaled to `document.body`, but it stays a React descendant of whatever
// opened it — so without containment its synthetic events bubble into a clickable row.
const RowWithDialog = ({
  open = true,
  onClick,
  onDoubleClick,
}: {
  open?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) => (
  <div onClick={onClick} onDoubleClick={onDoubleClick}>
    <button type={'button'}>{'Open'}</button>
    <CustomDialog open={open} onClose={() => {}}>
      <button type={'button'}>{'Confirm'}</button>
    </CustomDialog>
  </div>
);

describe('CustomDialog event containment', () => {
  it('keeps a click inside the dialog from reaching the row that opened it', () => {
    const onClick = vi.fn();
    const onDoubleClick = vi.fn();
    render(<RowWithDialog onClick={onClick} onDoubleClick={onDoubleClick} />, {wrapper});

    fireEvent.click(screen.getByRole('button', {name: 'Confirm'}));
    fireEvent.doubleClick(screen.getByRole('button', {name: 'Confirm'}));

    expect(onClick).not.toHaveBeenCalled();
    expect(onDoubleClick).not.toHaveBeenCalled();
  });

  it('leaves events outside the dialog alone', () => {
    const onClick = vi.fn();
    const onDoubleClick = vi.fn();
    render(<RowWithDialog open={false} onClick={onClick} onDoubleClick={onDoubleClick} />, {
      wrapper,
    });

    fireEvent.click(screen.getByRole('button', {name: 'Open'}));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('still runs a handler the caller passed', () => {
    const onClick = vi.fn();
    render(
      <CustomDialog open onClose={() => {}} onClick={onClick}>
        <button type={'button'}>{'Confirm'}</button>
      </CustomDialog>,
      {wrapper}
    );

    fireEvent.click(screen.getByRole('button', {name: 'Confirm'}));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
