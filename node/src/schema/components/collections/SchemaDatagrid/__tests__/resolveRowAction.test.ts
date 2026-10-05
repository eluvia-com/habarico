import {describe, expect, it} from 'vitest';
import {ActionSchema, LocalResourceSchema, ResourceActionSchema} from '@schema/types';
import {resolveRowAction} from '../resolveRowAction';

const action = (name: string, extra: Partial<ResourceActionSchema> = {}): ResourceActionSchema => ({
  name,
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  ...extra,
});

describe('resolveRowAction', () => {
  describe('with a configured descriptor', () => {
    it('resolves the action by name from the resource schema', () => {
      const actions = [action('preview'), action('show')];
      const resolved = resolveRowAction(actions, {name: 'preview'});
      expect((resolved?.schema as ResourceActionSchema)?.name).toBe('preview');
    });

    it('merges descriptor overrides onto the resolved schema', () => {
      const actions = [action('preview', {label: 'Original'})];
      const resolved = resolveRowAction(actions, {name: 'preview', label: 'Overridden'});
      expect(resolved?.schema.label).toBe('Overridden');
    });

    it("uses the descriptor's inline action over the schema map", () => {
      const inline: ActionSchema = {type: 'view', isDetail: true, label: 'Inline'};
      const resolved = resolveRowAction([action('show')], {
        name: 'whatever',
        action: inline,
      });
      expect(resolved?.schema.label).toBe('Inline');
    });

    it('returns undefined when the descriptor cannot be resolved (no silent show fallback)', () => {
      // `show` is present but must NOT be used: an explicit descriptor is never replaced.
      expect(resolveRowAction([action('show')], {name: 'missing'})).toBeUndefined();
    });
  });

  describe('without a descriptor (FE default gesture)', () => {
    it('falls back to the show action', () => {
      const actions = [action('edit'), action('show')];
      expect((resolveRowAction(actions)?.schema as ResourceActionSchema)?.name).toBe('show');
    });

    it('falls back to edit when show is absent', () => {
      const actions = [action('edit')];
      expect((resolveRowAction(actions)?.schema as ResourceActionSchema)?.name).toBe('edit');
    });

    it('returns undefined when neither show nor edit exist', () => {
      expect(resolveRowAction([action('preview')])).toBeUndefined();
    });

    it('returns undefined when actions are missing', () => {
      expect(resolveRowAction(undefined)).toBeUndefined();
    });
  });

  describe('with a linked descriptor', () => {
    const reference = {service: 'billing', resource: 'invoice'};
    const schemasWith =
      (actions?: ResourceActionSchema[], isLoading = false) =>
      () => ({
        schema: actions && ({actions} as LocalResourceSchema),
        isLoading,
      });

    it('resolves the action from the linked schema, not the row schema', () => {
      const resolved = resolveRowAction(
        [action('approve', {label: 'Row'})],
        {name: 'approve', reference},
        {schemas: schemasWith([action('approve', {label: 'Linked'})])}
      );
      expect(resolved?.schema.label).toBe('Linked');
    });

    it('binds to the linked resource and keeps the row only for the same resource', () => {
      const own = resolveRowAction(
        [],
        {name: 'approve', reference},
        {resource: 'billing/invoice', recordId: 7, schemas: schemasWith([action('approve')])}
      );
      const foreign = resolveRowAction(
        [],
        {name: 'approve', reference},
        {resource: 'shop/order', recordId: 7, schemas: schemasWith([action('approve')])}
      );
      expect(own?.actionContext).toEqual({resource: 'billing/invoice', recordPk: 7});
      expect(foreign?.actionContext).toEqual({resource: 'billing/invoice', recordPk: undefined});
    });

    it('does nothing while the linked schema is loading', () => {
      expect(
        resolveRowAction(
          [action('approve')],
          {name: 'approve', reference},
          {schemas: schemasWith(undefined, true)}
        )
      ).toBeUndefined();
    });
  });
});
