import {createContext} from 'react';
import type {
  PropertyLabelWidth,
  PropertyLineHeight,
  PropertyOrientation,
} from '../PropertyItem/PropertyItem';

/**
 * Row density — scales the vertical gap between rows, with the same semantics as `DataTable`
 * (`DataTableDensity`) so a global density setting can be passed straight through. `compact`
 * (default) matches the tight panel layout; `standard` / `comfortable` open the gap up.
 */
export type PropertyListDensity = 'compact' | 'standard' | 'comfortable';

/**
 * Lets a {@link PropertyList} pass shared defaults down to every {@link PropertyItem} it
 * contains — the props that are normally uniform across a whole list — so an edit form sets
 * them once on the list instead of on each field. A `PropertyItem`'s own prop always overrides
 * the inherited value. (`span` is deliberately excluded: it is inherently per-item.) `density`
 * additionally cascades to nested `PropertyList`s so a whole form shares one row spacing.
 */
export type PropertyListContextValue = {
  lineHeight?: PropertyLineHeight;
  labelWidth?: PropertyLabelWidth;
  orientation?: PropertyOrientation;
  density?: PropertyListDensity;
};

export const PropertyListContext = createContext<PropertyListContextValue>({});
