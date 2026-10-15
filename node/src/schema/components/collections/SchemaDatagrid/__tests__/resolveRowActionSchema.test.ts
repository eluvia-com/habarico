import {describe, expect, it} from 'vitest';
import {ActionSchema, ResourceActionSchema} from '@schema/types';
import {resolveRowActionSchema} from '../resolveRowActionSchema';

const action = (name: string, extra: Partial<ResourceActionSchema> = {}): ResourceActionSchema => ({
  name,
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  ...extra,
});

describe('resolveRowActionSchema', () => {
  describe('with a configured descriptor', () => {
    it('resolves the action by name from the resource schema', () => {
      const actions = [action('preview'), action('show')];
      const resolved = resolveRowActionSchema(actions, {name: 'preview'});
      expect((resolved as ResourceActionSchema)?.name).toBe('preview');
    });

    it('merges descriptor overrides onto the resolved schema', () => {
      const actions = [action('preview', {label: 'Original'})];
      const resolved = resolveRowActionSchema(actions, {name: 'preview', label: 'Overridden'});
      expect(resolved?.label).toBe('Overridden');
    });

    it("uses the descriptor's inline action over the schema map", () => {
      const inline: ActionSchema = {type: 'view', isDetail: true, label: 'Inline'};
      const resolved = resolveRowActionSchema([action('show')], {
        name: 'whatever',
        action: inline,
      });
      expect(resolved?.label).toBe('Inline');
    });

    it('returns undefined when the descriptor cannot be resolved (no silent show fallback)', () => {
      // `show` is present but must NOT be used: an explicit descriptor is never replaced.
      expect(resolveRowActionSchema([action('show')], {name: 'missing'})).toBeUndefined();
    });
  });

  describe('without a descriptor (FE default gesture)', () => {
    it('falls back to the show action', () => {
      const actions = [action('edit'), action('show')];
      expect((resolveRowActionSchema(actions) as ResourceActionSchema)?.name).toBe('show');
    });

    it('falls back to edit when show is absent', () => {
      const actions = [action('edit')];
      expect((resolveRowActionSchema(actions) as ResourceActionSchema)?.name).toBe('edit');
    });

    it('returns undefined when neither show nor edit exist', () => {
      expect(resolveRowActionSchema([action('preview')])).toBeUndefined();
    });

    it('returns undefined when actions are missing', () => {
      expect(resolveRowActionSchema(undefined)).toBeUndefined();
    });
  });
});
