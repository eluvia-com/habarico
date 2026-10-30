import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {recordLinkSx} from '@admin/components/fields/recordLinkSx';
import {render} from '@testing-library/react';
import {ReferenceField} from '../ReferenceField';

// React Admin's `ReferenceFieldView` spreads everything it does not consume onto its root `<span>`,
// which is why this wrapper must not hand it a `label`. The mock records what it receives.
const received: Record<string, unknown>[] = [];

vi.mock('react-admin', () => ({
  useLocaleState: () => ['cs'],
  ReferenceField: (props: Record<string, unknown>) => {
    received.push(props);
    return <span data-testid={'ra-reference-field'} />;
  },
}));

describe('ReferenceField', () => {
  it('does not forward label to the React Admin field', () => {
    render(
      <ReferenceField source={'owner_id'} reference={'owners'} label={false}>
        <span />
      </ReferenceField>
    );
    render(
      <ReferenceField source={'owner_id'} reference={'owners'} label={<span>{'Owner'}</span>}>
        <span />
      </ReferenceField>
    );

    expect(received).toHaveLength(2);
    received.forEach((props) => {
      expect(props).not.toHaveProperty('label');
      expect(props.source).toBe('owner_id');
      expect(props.reference).toBe('owners');
    });
  });

  // The link reset used to sit *before* the `{...rest}` spread, so any caller passing `sx` replaced
  // it outright and got React Admin's anchor styling back on a field that only looked linked.
  it('merges the caller sx with the link reset instead of replacing it', () => {
    received.length = 0;
    const callerSx = {color: 'red'};

    render(
      <ReferenceField source={'owner_id'} reference={'owners'} sx={callerSx}>
        <span />
      </ReferenceField>
    );

    expect(received[0].sx).toEqual([recordLinkSx, callerSx]);
  });

  it('keeps the link reset when the caller passes no sx', () => {
    received.length = 0;

    render(
      <ReferenceField source={'owner_id'} reference={'owners'}>
        <span />
      </ReferenceField>
    );

    expect(received[0].sx).toEqual([recordLinkSx, false]);
  });

  it('keeps every entry of an array sx', () => {
    received.length = 0;
    const a = {color: 'red'};
    const b = {fontWeight: 700};

    render(
      <ReferenceField source={'owner_id'} reference={'owners'} sx={[a, b]}>
        <span />
      </ReferenceField>
    );

    expect(received[0].sx).toEqual([recordLinkSx, a, b]);
  });
});
