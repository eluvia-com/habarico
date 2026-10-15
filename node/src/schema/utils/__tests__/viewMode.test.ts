import {describe, expect, it} from 'vitest';
import {ViewModeType} from '@schema/types';
import {
  isRoutedViewMode,
  resolveEffectiveMode,
  resolveOpenMode,
  resolveViewMode,
  viewModeToPresentation,
} from '../viewMode';

describe('isRoutedViewMode', () => {
  it('routes a view with no explicit mode (backend omits mode)', () => {
    expect(isRoutedViewMode(undefined)).toBe(true);
  });

  it('routes an inline "redirect" view', () => {
    expect(isRoutedViewMode('redirect')).toBe(true);
  });

  it('does not route a "dialog" view (opened from a trigger)', () => {
    expect(isRoutedViewMode('dialog')).toBe(false);
  });

  it('does not route a "sidepanel" view (opened from a trigger)', () => {
    expect(isRoutedViewMode('sidepanel')).toBe(false);
  });
});

describe('resolveViewMode', () => {
  it("uses the trigger's own mode when set (overrides the view default)", () => {
    expect(resolveViewMode('dialog', 'redirect')).toBe('dialog');
    expect(resolveViewMode('redirect', 'dialog')).toBe('redirect');
  });

  it("inherits the target view's mode when the trigger has none", () => {
    expect(resolveViewMode(undefined, 'dialog')).toBe('dialog');
    expect(resolveViewMode(undefined, 'sidepanel')).toBe('sidepanel');
  });

  it('falls back to redirect when neither trigger nor view specify a mode', () => {
    expect(resolveViewMode(undefined, undefined)).toBe('redirect');
  });
});

describe('resolveEffectiveMode', () => {
  describe('an explicit action mode is respected everywhere', () => {
    it.each(['sidepanel', 'dialog', 'redirect'] as const)(
      'keeps action mode "%s" regardless of container or view default',
      (actionMode) => {
        // top level and inside an overlay, routed or not - the explicit mode always wins.
        expect(resolveEffectiveMode(actionMode, 'sidepanel', false, false)).toBe(actionMode);
        expect(resolveEffectiveMode(actionMode, undefined, true, true)).toBe(actionMode);
        expect(resolveEffectiveMode(actionMode, 'dialog', true, false)).toBe(actionMode);
      }
    );
  });

  describe('a default gesture (no action mode) at top level follows the view default', () => {
    it('opens a sidepanel view in the sidepanel', () => {
      expect(resolveEffectiveMode(undefined, 'sidepanel', false, false)).toBe('sidepanel');
    });

    it('opens a dialog view as a dialog', () => {
      expect(resolveEffectiveMode(undefined, 'dialog', false, false)).toBe('dialog');
    });

    it('redirects when the view has no default mode', () => {
      expect(resolveEffectiveMode(undefined, undefined, false, true)).toBe('redirect');
      expect(resolveEffectiveMode(undefined, 'redirect', false, true)).toBe('redirect');
    });
  });

  describe('a default gesture inside an overlay escapes instead of nesting a sidepanel', () => {
    it('redirects a routed view rather than docking it', () => {
      // e.g. a show/edit button inside the side panel, target view is routed.
      expect(resolveEffectiveMode(undefined, undefined, true, true)).toBe('redirect');
    });

    it('falls back to a dialog when the view is not routed', () => {
      // the mode is sidepanel/dialog (not routed), so there is no URL to redirect to.
      expect(resolveEffectiveMode(undefined, 'sidepanel', true, false)).toBe('dialog');
      expect(resolveEffectiveMode(undefined, 'dialog', true, false)).toBe('dialog');
    });
  });
});

// The surface a trigger really opens on, for every combination of the four inputs. Read the three
// tables as one: the action's mode and the target view's own mode go in, the container and the
// availability of a docked panel decide the rest.
type Case = [
  actionMode: ViewModeType | undefined,
  viewDefaultMode: ViewModeType | undefined,
  hasSidePanel: boolean,
  expected: ViewModeType,
];

// action mode | target view mode | a panel to dock into | resolved mode
const PAGE_CASES: Case[] = [
  [undefined, undefined, false, 'redirect'],
  [undefined, 'redirect', false, 'redirect'],
  [undefined, 'dialog', false, 'dialog'],
  [undefined, 'sidepanel', false, 'dialog'],
  [undefined, 'sidepanel', true, 'sidepanel'],
  ['redirect', undefined, false, 'redirect'],
  ['redirect', 'dialog', false, 'redirect'],
  ['dialog', undefined, false, 'dialog'],
  ['dialog', 'sidepanel', true, 'dialog'],
  ['sidepanel', undefined, false, 'dialog'],
  ['sidepanel', undefined, true, 'sidepanel'],
  ['sidepanel', 'dialog', true, 'sidepanel'],
];

// Inside an overlay a default gesture never opens a nested panel: it escapes to a redirect, or to a
// dialog when the target view has no route of its own.
const OVERLAY_CASES: Case[] = [
  [undefined, undefined, false, 'redirect'],
  [undefined, 'redirect', false, 'redirect'],
  [undefined, undefined, true, 'redirect'],
  [undefined, 'dialog', false, 'dialog'],
  [undefined, 'dialog', true, 'dialog'],
  [undefined, 'sidepanel', false, 'dialog'],
  [undefined, 'sidepanel', true, 'dialog'],
  ['redirect', undefined, false, 'redirect'],
  ['redirect', 'dialog', true, 'redirect'],
  ['dialog', undefined, true, 'dialog'],
  ['sidepanel', undefined, false, 'dialog'],
  ['sidepanel', undefined, true, 'sidepanel'],
];

describe('resolveOpenMode', () => {
  it.each(PAGE_CASES)(
    'on a page: action %s, view %s, panel %s -> %s',
    (actionMode, viewDefaultMode, hasSidePanel, expected) => {
      expect(resolveOpenMode(actionMode, viewDefaultMode, 'page', hasSidePanel)).toBe(expected);
    }
  );

  it.each(OVERLAY_CASES)(
    'in a dialog: action %s, view %s, panel %s -> %s',
    (actionMode, viewDefaultMode, hasSidePanel, expected) => {
      expect(resolveOpenMode(actionMode, viewDefaultMode, 'dialog', hasSidePanel)).toBe(expected);
    }
  );

  it.each(OVERLAY_CASES)(
    'in the side panel: action %s, view %s, panel %s -> %s',
    (actionMode, viewDefaultMode, hasSidePanel, expected) => {
      expect(resolveOpenMode(actionMode, viewDefaultMode, 'panel', hasSidePanel)).toBe(expected);
    }
  );
});

describe('viewModeToPresentation', () => {
  it('maps each wire mode onto the admin presentation surface it means', () => {
    expect(viewModeToPresentation('redirect')).toBe('page');
    expect(viewModeToPresentation('dialog')).toBe('dialog');
    expect(viewModeToPresentation('sidepanel')).toBe('panel');
  });

  it('passes an absent mode through, leaving the link to its own default', () => {
    expect(viewModeToPresentation(undefined)).toBeUndefined();
  });
});
