import {describe, expect, it} from 'vitest';
import {
  ActionSchema,
  AnyActionDescriptor,
  LocalResourceSchema,
  ResourceActionSchema,
} from '@schema/types';
import {
  ReferencedSchemasLookup,
  collectDescriptorReferences,
  descriptorsMayRender,
  expandDefaultActions,
  resolveActionDescriptor,
} from '@schema/utils/actionDescriptor';

const action = (name: string, extra: Partial<ResourceActionSchema> = {}): ResourceActionSchema => ({
  name,
  type: 'resource',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  ...extra,
});

const invoice = {service: 'billing', resource: 'invoice'};
const local = {
  actions: [action('approve', {label: 'Local'})],
  resource: 'shop/order',
  recordId: 7,
};
const schemasWith =
  (actions?: ResourceActionSchema[], isLoading = false): ReferencedSchemasLookup =>
  () => ({schema: actions && ({actions} as LocalResourceSchema), isLoading});

const resolution = (result: ReturnType<typeof resolveActionDescriptor>) =>
  result.status === 'resolved' ? result.actionContext : undefined;

describe('resolveActionDescriptor', () => {
  it('looks a descriptor without a reference up in the surrounding actions', () => {
    const resolution = resolveActionDescriptor({name: 'approve'}, local);
    expect(resolution).toEqual({
      status: 'resolved',
      schema: expect.objectContaining({label: 'Local'}),
      actionContext: undefined,
    });
  });

  it('looks a linked descriptor up in the schema its reference loads', () => {
    const resolution = resolveActionDescriptor(
      {name: 'approve', reference: invoice},
      local,
      schemasWith([action('approve', {label: 'Linked'})])
    );
    expect(resolution.status === 'resolved' && resolution.schema.label).toBe('Linked');
  });

  it('prefers an inline action and still binds it to the reference', () => {
    const inline: ActionSchema = {type: 'resource', isDetail: false, label: 'Inline'};
    const resolution = resolveActionDescriptor(
      {name: 'approve', action: inline, reference: invoice},
      local,
      schemasWith(undefined, true)
    );
    expect(resolution).toEqual({
      status: 'resolved',
      schema: expect.objectContaining({label: 'Inline'}),
      actionContext: {resource: 'billing/invoice', recordPk: undefined},
    });
  });

  it('merges the descriptor overrides onto the linked action', () => {
    const resolution = resolveActionDescriptor(
      {name: 'approve', reference: invoice, label: 'Approve invoice'},
      local,
      schemasWith([action('approve', {label: 'Approve'})])
    );
    expect(resolution.status === 'resolved' && resolution.schema.label).toBe('Approve invoice');
  });

  it('tells a linked schema still loading apart from an action that does not exist', () => {
    const descriptor = {name: 'approve', reference: invoice};
    expect(resolveActionDescriptor(descriptor, local, schemasWith(undefined, true))).toEqual({
      status: 'loading',
    });
    expect(resolveActionDescriptor(descriptor, local, schemasWith([action('other')]))).toEqual({
      status: 'invalid',
    });
    expect(resolveActionDescriptor(descriptor, local, schemasWith(undefined))).toEqual({
      status: 'invalid',
    });
  });

  describe('actionContext', () => {
    const resolve = (reference: typeof invoice & {recordPk?: number}, surrounding = local) =>
      resolveActionDescriptor(
        {name: 'approve', reference},
        surrounding,
        schemasWith([action('approve')])
      );

    it('takes the record of the reference', () => {
      const resolution = resolve({...invoice, recordPk: 3});
      expect(resolution.status === 'resolved' && resolution.actionContext).toEqual({
        resource: 'billing/invoice',
        recordPk: 3,
      });
    });

    it('never takes the surrounding record of another resource', () => {
      const resolution = resolve(invoice);
      expect(resolution.status === 'resolved' && resolution.actionContext).toEqual({
        resource: 'billing/invoice',
        recordPk: undefined,
      });
    });

    it('links back to the surrounding record a `_target` names', () => {
      const linkedToOrder = {...invoice, params: {_target: '{"order_id":7}'}};
      const resolution = resolve(linkedToOrder);
      expect(resolution.status === 'resolved' && resolution.actionContext).toEqual({
        resource: 'billing/invoice',
        recordPk: undefined,
        parent: {resource: 'shop/order', recordId: 7, target: 'order_id'},
      });
    });

    it('has no parent without a `_target`, or with one that is not JSON', () => {
      const broken = resolve({...invoice, params: {_target: 'not json'}} as typeof invoice);
      expect(resolution(resolve(invoice))).not.toHaveProperty('parent');
      expect(resolution(broken)).not.toHaveProperty('parent');
    });

    it('keeps the surrounding record when it belongs to the referenced resource', () => {
      const resolution = resolve(invoice, {...local, resource: 'billing/invoice'});
      expect(resolution.status === 'resolved' && resolution.actionContext).toEqual({
        resource: 'billing/invoice',
        recordPk: 7,
      });
    });
  });

  describe('a menu', () => {
    const missing = {name: 'missing'};

    it('resolves when any of its items does', () => {
      expect(
        resolveActionDescriptor({name: 'menu', menuItems: [missing, {name: 'approve'}]}, local)
          .status
      ).toBe('resolved');
    });

    it('is loading while no item resolved and one still loads', () => {
      const menu = {name: 'menu', menuItems: [missing, {name: 'approve', reference: invoice}]};
      expect(resolveActionDescriptor(menu, local, schemasWith(undefined, true)).status).toBe(
        'loading'
      );
    });

    it('is invalid when no item can resolve', () => {
      expect(resolveActionDescriptor({name: 'menu', menuItems: [missing]}, local).status).toBe(
        'invalid'
      );
    });
  });
});

describe('collectDescriptorReferences', () => {
  it('returns each distinct reference once, menu items included', () => {
    const descriptors = [
      {name: 'approve', reference: invoice},
      {name: 'menu', menuItems: [{name: 'reject', reference: {...invoice}}]},
      {name: 'show', reference: {...invoice, recordPk: 3}},
    ];
    expect(collectDescriptorReferences(descriptors)).toEqual([invoice, {...invoice, recordPk: 3}]);
  });

  it('skips a reference whose action is inline, since nothing is looked up', () => {
    const inline: ActionSchema = {type: 'resource', isDetail: false};
    expect(
      collectDescriptorReferences([{name: 'approve', action: inline, reference: invoice}])
    ).toEqual([]);
  });

  it('collects the reference of a DefaultActions entry, but not one without it', () => {
    const descriptors: AnyActionDescriptor[] = [
      {type: 'default_actions', reference: invoice},
      {type: 'default_actions'},
    ];
    expect(collectDescriptorReferences(descriptors)).toEqual([invoice]);
  });
});

describe('expandDefaultActions', () => {
  // A record action shown in lists and details, a collection action, and an action that opens the
  // `show` view of its own resource.
  const actions = [
    action('approve', {isDetail: true}),
    action('export', {isDetail: false}),
    action('show', {type: 'view', isDetail: true, view: {name: 'show'} as ActionSchema['view']}),
  ];
  const names = (descriptors: {name: string}[]) => descriptors.map((d) => d.name);
  const own = {actions, resource: 'billing/invoice', recordId: 7};

  it('keeps named descriptors as they are', () => {
    expect(expandDefaultActions([{name: 'approve'}], own, schemasWith(), {isList: true})).toEqual([
      {name: 'approve'},
    ]);
  });

  it('expands defaults without a reference from the surrounding actions', () => {
    const slot = [{type: 'default_actions' as const, scope: 'detail' as const}];
    expect(names(expandDefaultActions(slot, own, schemasWith(), {isList: true}))).toEqual([
      'approve',
      'show',
    ]);
  });

  it('leaves out the action opening the very view the slot belongs to', () => {
    const slot = [{type: 'default_actions' as const}];
    expect(
      names(expandDefaultActions(slot, own, schemasWith(), {isList: false, viewName: 'show'}))
    ).toEqual(['approve', 'export']);
  });

  describe('with a reference', () => {
    const schemas = schemasWith(actions);

    it('expands from the linked schema, every descriptor carrying the reference', () => {
      const slot = [{type: 'default_actions' as const, reference: invoice, scope: 'list' as const}];
      expect(expandDefaultActions(slot, local, schemas, {isList: false})).toEqual([
        {name: 'export', label: undefined, icon: undefined, reference: invoice},
      ]);
    });

    // A reference to a collection reads it as a list, one with a record as that record's detail —
    // whatever the slot's own surface says.
    it.each([
      ['a collection', invoice, true],
      ['a record', {...invoice, recordPk: 3}, false],
    ])('reads a reference to %s by its own surface', (_, reference, isList) => {
      const showInListOnly = schemasWith([
        action('approve', {showInDetail: !isList, showInList: isList}),
      ]);
      const slot = [{type: 'default_actions' as const, reference}];
      expect(names(expandDefaultActions(slot, local, showInListOnly, {isList: !isList}))).toEqual([
        'approve',
      ]);
    });

    it('suppresses the action opening the current view only for the current resource', () => {
      const slot = [{type: 'default_actions' as const, reference: {...invoice, recordPk: 3}}];
      const surface = {isList: false, viewName: 'show'};
      expect(names(expandDefaultActions(slot, own, schemas, surface))).not.toContain('show');
      expect(names(expandDefaultActions(slot, local, schemas, surface))).toContain('show');
    });

    it('contributes nothing while the linked schema loads', () => {
      const slot = [{type: 'default_actions' as const, reference: invoice}];
      expect(
        expandDefaultActions(slot, local, schemasWith(undefined, true), {isList: true})
      ).toEqual([]);
    });
  });
});

describe('descriptorsMayRender', () => {
  const actions = [action('export', {isDetail: false})];

  it('is false for an empty slot', () => {
    expect(descriptorsMayRender([], actions, true)).toBe(false);
  });

  it('is true for a named entry only when the resource has that action', () => {
    expect(descriptorsMayRender([{name: 'export'}], actions, true)).toBe(true);
    expect(descriptorsMayRender([{name: 'approve'}], actions, true)).toBe(false);
    expect(
      descriptorsMayRender([{name: 'menu', menuItems: [{name: 'export'}]}], actions, true)
    ).toBe(true);
  });

  it('is true for a linked entry', () => {
    expect(
      descriptorsMayRender([{type: 'default_actions', reference: invoice}], actions, true)
    ).toBe(true);
  });

  it('asks the resource whether its own defaults offer anything in that scope', () => {
    expect(descriptorsMayRender([{type: 'default_actions', scope: 'list'}], actions, true)).toBe(
      true
    );
    expect(descriptorsMayRender([{type: 'default_actions', scope: 'detail'}], actions, true)).toBe(
      false
    );
  });
});
