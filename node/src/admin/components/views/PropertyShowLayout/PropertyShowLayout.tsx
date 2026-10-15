import React from 'react';
import {useTranslateLabel} from 'react-admin';
import {PropertyItem} from '@design/molecules/PropertyItem';
import {PropertyList, type PropertyListProps} from '@design/molecules/PropertyList';

// The `PropertyList` layout knobs a caller may forward through to tune the grid (columns, gaps,
// density, label placement). Everything else about a `PropertyList` (its children, nesting) is
// managed by this layout, so it is intentionally not surfaced.
type ForwardedListProps = Pick<
  PropertyListProps,
  | 'columns'
  | 'columnGap'
  | 'rowGap'
  | 'density'
  | 'lineHeight'
  | 'labelWidth'
  | 'orientation'
  | 'emptyMessage'
  | 'sx'
>;

export type PropertyShowLayoutProps = ForwardedListProps & {
  /**
   * React Admin field elements (`TextField`, `NumberField`, `ReferenceField`, …). Each becomes
   * one label + value row; non-element children are ignored.
   */
  children: React.ReactNode;
};

// Lay a single React Admin field out as a `PropertyList` row. The label is resolved exactly the way
// React Admin's `<Labeled>` (and therefore `SimpleShowLayout`) does — the field's own `label` prop,
// else the i18n label derived from `source` via `useTranslateLabel`, which reads the resource from
// the enclosing view context — and handed to `PropertyItem.label`. The field renders as the value,
// since React Admin fields carry no label of their own (only their wrapper does).
const FieldPropertyItem = ({children}: {children: React.ReactElement}) => {
  const translateLabel = useTranslateLabel();
  const {source, label} = children.props as {source?: string; label?: React.ReactNode};
  return <PropertyItem label={translateLabel({source, label})}>{children}</PropertyItem>;
};

/**
 * A React-Admin show layout that renders its field children in the design `PropertyList` grid
 * (label + value pairs) instead of React Admin's stacked `<Labeled>` list — the design-system
 * counterpart of `SimpleShowLayout`.
 *
 * Drop it inside a `<Show>` (or any record context) and pass plain React Admin fields; each field's
 * label is pulled automatically (its `label` prop, else the i18n label for its `source`) and the
 * field itself is rendered as the value. Forward `PropertyList` props (`columns`, `density`, …) to
 * tune the grid; `lineHeight` defaults to `smallField`, a minimum row height that keeps rows of
 * different value types (a text value, a chip) on one rhythm — a taller value still grows past it.
 *
 * @example
 * <PropertyShowLayout columns={2}>
 *   <TextField source="type" />
 *   <ReferenceField source="owner_id" reference="owners" label="Owner" />
 * </PropertyShowLayout>
 */
export const PropertyShowLayout = ({
  children,
  lineHeight = 'smallField',
  ...listProps
}: PropertyShowLayoutProps) => (
  <PropertyList lineHeight={lineHeight} {...listProps}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child) ? <FieldPropertyItem>{child}</FieldPropertyItem> : null
    )}
  </PropertyList>
);
