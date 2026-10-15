import {describe, expect, it} from 'vitest';
import {ResourceActionSchema} from '@schema/types';
import {generateDescriptorsFromSchema} from '../generateDescriptorsFromSchema';

const action = (name: string, extra: Partial<ResourceActionSchema> = {}): ResourceActionSchema => ({
  name,
  type: 'view',
  isDetail: true,
  showInList: true,
  showInDetail: true,
  ...extra,
});

describe('generateDescriptorsFromSchema', () => {
  it('maps each kept action to a name/label/icon descriptor', () => {
    const descriptors = generateDescriptorsFromSchema(
      [action('show', {label: 'Detail', icon: 'Visibility'})],
      true,
      'all'
    );
    expect(descriptors).toEqual([{name: 'show', label: 'Detail', icon: 'Visibility'}]);
  });

  describe('in list mode (isList = true)', () => {
    it('keeps only actions flagged showInList', () => {
      const actions = [action('show'), action('hidden', {showInList: false})];
      const names = generateDescriptorsFromSchema(actions, true, 'all').map((d) => d.name);
      expect(names).toEqual(['show']);
    });

    it('ignores showInDetail', () => {
      const actions = [action('a', {showInDetail: false})];
      const names = generateDescriptorsFromSchema(actions, true, 'all').map((d) => d.name);
      expect(names).toEqual(['a']);
    });

    it("scope 'detail' keeps only record-scoped (isDetail) actions", () => {
      const actions = [action('edit'), action('create', {isDetail: false})];
      const names = generateDescriptorsFromSchema(actions, true, 'detail').map((d) => d.name);
      expect(names).toEqual(['edit']);
    });

    it("scope 'list' keeps only collection-scoped (!isDetail) actions", () => {
      const actions = [action('edit'), action('create', {isDetail: false})];
      const names = generateDescriptorsFromSchema(actions, true, 'list').map((d) => d.name);
      expect(names).toEqual(['create']);
    });
  });

  describe('in detail mode (isList = false)', () => {
    it('keeps only actions flagged showInDetail', () => {
      const actions = [action('edit'), action('listOnly', {showInDetail: false})];
      const names = generateDescriptorsFromSchema(actions, false, 'all', 'list').map((d) => d.name);
      expect(names).toEqual(['edit']);
    });

    it('drops the action whose view targets the current viewName', () => {
      const actions = [action('edit', {view: {name: 'edit'} as ResourceActionSchema['view']})];
      const names = generateDescriptorsFromSchema(actions, false, 'all', 'edit').map((d) => d.name);
      expect(names).toEqual([]);
    });

    it('keeps the self-targeting action when its view has an endpoint reference', () => {
      const actions = [
        action('edit', {
          view: {name: 'edit', endpoint: {reference: 'owners'}} as ResourceActionSchema['view'],
        }),
      ];
      const names = generateDescriptorsFromSchema(actions, false, 'all', 'edit').map((d) => d.name);
      expect(names).toEqual(['edit']);
    });

    it("drops non-detail actions when scope is 'detail'", () => {
      const actions = [action('detail'), action('global', {isDetail: false})];
      const names = generateDescriptorsFromSchema(actions, false, 'detail', 'list').map(
        (d) => d.name
      );
      expect(names).toEqual(['detail']);
    });
  });
});
