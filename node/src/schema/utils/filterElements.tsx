import React from 'react';
import {SchemaFilter} from '@schema/components/filters/SchemaFilter';
import {FilterSchema} from '@schema/types';

// NOTE: these are element *builders*, not components. React Admin's FilterForm /
// FilterButton decide which filters to render by reading `alwaysOn` / `source`
// off the OUTER element (see ra-ui FilterForm.getShownFilters). If we wrapped
// SchemaFilter in a component, those props would live on the inner element and
// stay invisible to React Admin, so the filter would silently never render.
// Returning the SchemaFilter element directly keeps `source`/`alwaysOn` on top.

export const buildDrawerFilter = (filterSchema: FilterSchema) => (
  <SchemaFilter
    key={filterSchema.name}
    schema={filterSchema}
    label={filterSchema.label}
    source={filterSchema.name}
    alwaysOn
    defaultValue={filterSchema.defaultValue}
  />
);

export const buildInlineFilter = (filterSchema: FilterSchema) => (
  <SchemaFilter
    key={filterSchema.name}
    schema={filterSchema}
    label={filterSchema.label}
    source={filterSchema.name}
    alwaysOn={filterSchema.isAlwaysOn}
    defaultValue={filterSchema.isAlwaysOn ? undefined : filterSchema.defaultValue}
  />
);
