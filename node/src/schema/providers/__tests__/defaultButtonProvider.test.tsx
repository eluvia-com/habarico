import {describe, expect, it} from 'vitest';
import {ExportButton} from '@schema/components/buttons/ExportButton';
import {ActionSchema} from '@schema/types';
import {defaultButtonProvider} from '../defaultButtonProvider';

describe('defaultButtonProvider', () => {
  it('renders ExportButton for the export action type', () => {
    const schema: ActionSchema = {type: 'export', isDetail: false};
    const props = {size: 'small' as const};

    const element = defaultButtonProvider({schema, props});

    expect(element?.type).toBe(ExportButton);
    expect(element?.props).toMatchObject(props);
  });

  it('passes the export action parameters to ExportButton', () => {
    const schema: ActionSchema = {
      type: 'export',
      isDetail: false,
      export: {format: 'xlsx', fields: ['name', 'price']},
    };

    const element = defaultButtonProvider({schema, props: {}});

    expect(element?.type).toBe(ExportButton);
    expect(element?.props).toMatchObject({format: 'xlsx', fields: ['name', 'price']});
  });
});
