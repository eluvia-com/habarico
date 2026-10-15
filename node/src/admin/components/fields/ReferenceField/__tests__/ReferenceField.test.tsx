import React from 'react';
import {describe, expect, it, vi} from 'vitest';
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
});
