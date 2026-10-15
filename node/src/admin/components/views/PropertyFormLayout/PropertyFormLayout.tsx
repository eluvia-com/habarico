import React from 'react';
import {FormDataConsumer, type FormDataConsumerRender, useTranslateLabel} from 'react-admin';
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

export type PropertyFormLayoutProps = ForwardedListProps & {
  /**
   * React Admin input elements (`TextInput`, `NumberInput`, `SelectInput`, …). Each becomes one
   * label + input row; non-element children are ignored.
   */
  children: React.ReactNode;
};

// Re-derive React Admin's own required flag from the outside. `useInput` reads it from the
// validators — the `required()` validator marks the function it returns with `isRequired = true`.
// We need it here because the input's own label (which carries the `*`) is stripped, so the marker
// has to be reconstructed onto the `PropertyItem` label.
const isValidatorRequired = (validate: unknown): boolean => {
  if (Array.isArray(validate)) {
    return validate.some(isValidatorRequired);
  }
  return typeof validate === 'function' && (validate as {isRequired?: boolean}).isRequired === true;
};

// The input props this layout reads/overrides from the outside. Typed so `React.cloneElement` knows
// `label` / `fullWidth` are valid props to inject.
type InputElementProps = {
  source?: string;
  label?: React.ReactNode;
  validate?: unknown;
  isRequired?: boolean;
  fullWidth?: boolean;
};

// The props of a `<FormDataConsumer>` element: its `children` is a render function, not a node. Its
// deprecated `source` prop needs no forwarding — array-item scoping comes from `SourceContext`.
type FormDataConsumerElementProps = {
  children: FormDataConsumerRender;
};

type InputRow = {key: string; element: React.ReactElement<InputElementProps>};

// Flatten what the layout is handed — its own children, or whatever a `<FormDataConsumer>` render
// function returns — into one entry per row. Arrays and fragments are unwrapped, so every input they
// hold gets its own row. Anything that is not an element (`null`, `false`, a string) renders nothing.
// Keys are prefixed with the enclosing fragment's key, so two fragments never hand out the same
// key, and a row keeps its key while a sibling before it toggles on and off.
const toInputRows = (node: React.ReactNode, keyPrefix = ''): InputRow[] =>
  React.Children.toArray(node).flatMap((child): InputRow[] => {
    if (!React.isValidElement(child)) return [];
    const key = `${keyPrefix}${child.key}`;
    if (child.type === React.Fragment) {
      return toInputRows((child.props as {children?: React.ReactNode}).children, key);
    }
    return [{key, element: child as React.ReactElement<InputElementProps>}];
  });

const renderRows = (node: React.ReactNode) =>
  toInputRows(node).map(({key, element}) => (
    <InputPropertyItem key={key}>{element}</InputPropertyItem>
  ));

// A `<FormDataConsumer>` carries no `source`/`label` of its own, and cloning it would never reach the
// input it returns, so it is resolved here instead: a `FormDataConsumer` rendered in the same spot
// reads the same `SourceContext` (e.g. the current `ArrayInput` item), and whatever it returns is
// laid out like any other children.
const FormDataConsumerRows = ({render}: {render: FormDataConsumerRender}) => (
  <FormDataConsumer>{(params) => <>{renderRows(render(params))}</>}</FormDataConsumer>
);

// Lay a single React Admin input out as a `PropertyList` row. The label is resolved exactly the way
// React Admin's `<Labeled>` does — the input's own `label` prop, else the i18n label derived from
// `source` via `useTranslateLabel`, which reads the resource from the enclosing view context — and
// handed to `PropertyItem.label` (with the required `*` re-appended). The input itself renders as
// the value with its own label suppressed (`label={false}`), so the label lives only in the
// `PropertyItem` column, and stretched to fill that column (`fullWidth`) unless it opts out.
const InputPropertyItem = ({children}: {children: React.ReactElement<InputElementProps>}) => {
  const translateLabel = useTranslateLabel();

  if (children.type === FormDataConsumer) {
    const {children: render} = children.props as unknown as FormDataConsumerElementProps;
    return <FormDataConsumerRows render={render} />;
  }

  const {source, label, validate, isRequired, fullWidth} = children.props;

  const required = isRequired ?? isValidatorRequired(validate);
  const translated = translateLabel({source, label});
  // Re-append the required marker onto the resolved label; a suppressed label (`label={false}`,
  // which resolves to a falsy value here) stays empty.
  const itemLabel = required && translated ? <>{translated} *</> : translated;

  const input = React.cloneElement(children, {label: false, fullWidth: fullWidth ?? true});
  return <PropertyItem label={itemLabel}>{input}</PropertyItem>;
};

/**
 * A React-Admin form layout that renders its input children in the design `PropertyList` grid
 * (label + input pairs) instead of stacking React Admin inputs with their own outlined labels — the
 * design-system, edit-view counterpart of `PropertyShowLayout`.
 *
 * Drop it inside a `<SimpleForm>` / `FormShell` (or any form + record context) and pass plain React
 * Admin inputs; each input's label is pulled automatically (its `label` prop, else the i18n label
 * for its `source`) and moved into the `PropertyItem` label column — the input's own label is
 * suppressed (`label={false}`) and, unless it sets `fullWidth` itself, stretched to fill the value
 * column. Required inputs (via `validate={required()}` or an `isRequired` prop) keep their `*`
 * marker. Forward `PropertyList` props (`columns`, `density`, …) to tune the grid; `lineHeight`
 * defaults to `smallInput` so labels line up with the inputs in the horizontal layout.
 *
 * A child can also be a fragment, which gives each input inside it a row, or a `<FormDataConsumer>` —
 * the standard idiom for inputs whose visibility or props depend on other form values — resolved the
 * way React Admin resolves it: whatever it currently returns (one input, several, a fragment) is laid
 * out the same way, and its rows disappear completely while it returns nothing. Any other wrapper
 * component is read as an input, so its label comes from the wrapper's own `source`/`label` props.
 *
 * @example
 * <PropertyFormLayout columns={2}>
 *   <TextInput source="address" validate={required()} />
 *   <NumberInput source="area" />
 *   <SelectInput source="type" choices={typeChoices} />
 * </PropertyFormLayout>
 */
export const PropertyFormLayout = ({
  children,
  lineHeight = 'smallInput',
  ...listProps
}: PropertyFormLayoutProps) => (
  <PropertyList lineHeight={lineHeight} {...listProps}>
    {renderRows(children)}
  </PropertyList>
);
