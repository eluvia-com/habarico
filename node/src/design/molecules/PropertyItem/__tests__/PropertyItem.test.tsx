import React from 'react';
import {describe, expect, it} from 'vitest';
import {createLightTheme} from '@design/theme';
import {ThemeProvider} from '@mui/material';
import {render} from '@testing-library/react';
import {PropertyList} from '../../PropertyList';
import {PropertyItem} from '../PropertyItem';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ThemeProvider theme={createLightTheme()}>{children}</ThemeProvider>
);

const cells = (container: HTMLElement) => ({
  label: container.querySelector('.PropertyItem-label') as HTMLElement,
  value: container.querySelector('.PropertyItem-value') as HTMLElement,
});

describe('PropertyItem lineHeight', () => {
  it('reserves the smallField height on both cells in the horizontal layout', () => {
    const {container} = render(
      <PropertyItem label={'Customer'} orientation={'horizontal'} lineHeight={'smallField'}>
        SparkTECH s.r.o.
      </PropertyItem>,
      {wrapper}
    );
    const {label, value} = cells(container);
    expect(getComputedStyle(label).minHeight).toBe('28px');
    expect(getComputedStyle(value).minHeight).toBe('28px');
    expect(getComputedStyle(value).alignContent).toBe('center');
  });

  it('reserves no height when the item is stacked', () => {
    const {container} = render(
      <PropertyItem label={'Customer'} orientation={'vertical'} lineHeight={'smallField'}>
        SparkTECH s.r.o.
      </PropertyItem>,
      {wrapper}
    );
    const {label, value} = cells(container);
    expect(getComputedStyle(label).minHeight).toBe('auto');
    expect(getComputedStyle(value).minHeight).toBe('auto');
  });

  it('inherits smallField from the enclosing PropertyList', () => {
    const {container} = render(
      <PropertyList lineHeight={'smallField'} orientation={'horizontal'}>
        <PropertyItem label={'Customer'}>SparkTECH s.r.o.</PropertyItem>
      </PropertyList>,
      {wrapper}
    );
    expect(getComputedStyle(cells(container).value).minHeight).toBe('28px');
  });

  it('resolves mediumField to the smallInput height, for a read panel aligned to a form', () => {
    const {container} = render(
      <PropertyItem label={'Customer'} orientation={'horizontal'} lineHeight={'mediumField'}>
        SparkTECH s.r.o.
      </PropertyItem>,
      {wrapper}
    );
    expect(getComputedStyle(cells(container).value).minHeight).toBe('40px');
  });

  it('still resolves the smallInput preset used by forms', () => {
    const {container} = render(
      <PropertyItem label={'Name'} orientation={'horizontal'} lineHeight={'smallInput'}>
        Anna
      </PropertyItem>,
      {wrapper}
    );
    expect(getComputedStyle(cells(container).value).minHeight).toBe('40px');
  });
});
