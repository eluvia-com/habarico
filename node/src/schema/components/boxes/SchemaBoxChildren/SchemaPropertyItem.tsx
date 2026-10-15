import React, {ReactElement} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {PropertyItem} from '@design/molecules/PropertyItem';
import {SchemaActionField} from '@schema/components/boxes/SchemaActionField';
import {SchemaFieldOrInputContent} from '@schema/components/boxes/SchemaFieldOrInputContent';
import {SchemaWrappedFields} from '@schema/components/boxes/SchemaWrappedFields';
import {DynamicRenderWrapper} from '@schema/components/dynamic/DynamicRenderWrapper';
import {useFieldSchemaMapContext} from '@schema/contexts/FieldSchemaMapContext/useFieldSchemaMapContext';
import {FieldDescriptor, FieldSchema} from '@schema/types';

type SchemaPropertyItemProps = {
  field: FieldDescriptor;
};

/**
 * Maps a single field descriptor to a `PropertyItem`: the box owns the label, and the value slot
 * holds the bare field/input (read → the value, edit → the label-less input), an inline wrapper
 * group, or an action button. Rendered inside a `SchemaFieldGroup`'s `FieldSchemaMapProvider`, so
 * it resolves the field schema (with the descriptor overrides already merged) from context.
 *
 * Wrapped in `React.memo`: this is the per-field row for every plain (non-array) box in the
 * library, rendered once per field by `SchemaFieldGroup`'s `.map()`. Without it, any unrelated
 * re-render of the surrounding box (a sibling field's own value changing, an ancestor context
 * update) re-executes every other field's row too, not just the one that actually changed — the
 * same fan-out `FormTableRow` had for array lists, just on the far more common plain-field path.
 */
const SchemaPropertyItemComponent = ({field}: SchemaPropertyItemProps) => {
  const fieldSchemaMap = useFieldSchemaMapContext();
  const fieldSchema = fieldSchemaMap[field.name];

  const row = renderRow(field, fieldSchema);
  if (!row) return null;

  // The row owns the slot, so it evaluates `showQuery` and hides label and value together; the value
  // inside renders without a check of its own. An action/wrapper field has no field schema, so its
  // query sits on the descriptor; a plain field's schema already has the descriptor's override merged.
  const showQuery = (field.action || field.wrapper ? field.options : fieldSchema?.options)
    ?.dynamicRender?.showQuery;

  return <DynamicRenderWrapper showQuery={showQuery}>{row}</DynamicRenderWrapper>;
};

export const SchemaPropertyItem = React.memo(SchemaPropertyItemComponent);

const renderRow = (
  field: FieldDescriptor,
  fieldSchema: FieldSchema | undefined
): ReactElement | undefined => {
  // Action field: the button is the value.
  if (field.action) {
    return (
      <PropertyItem label={<DynamicText>{field.label}</DynamicText>}>
        <SchemaActionField action={field.action} />
      </PropertyItem>
    );
  }

  // Wrapper field: the inline group is the value. The PropertyItem owns the wrapper label, so the
  // group itself renders label-less.
  if (field.wrapper) {
    return (
      <PropertyItem label={<DynamicText>{field.label}</DynamicText>}>
        <SchemaWrappedFields
          fields={field.wrapper.fields}
          divider={field.wrapper.divider}
          label={false}
        />
      </PropertyItem>
    );
  }

  if (!fieldSchema) return;

  const source = fieldSchema.name || field.name;
  // Templates in the label/help resolve against the field's parent path (the source minus its
  // last segment), matching how `SchemaField` renders its own label.
  const rootSource = source.split('.').slice(0, -1).join('.');

  // The generated map already merged the descriptor's label/helpText onto the field schema.
  return (
    <PropertyItem
      label={<DynamicText source={rootSource}>{fieldSchema.label ?? ''}</DynamicText>}
      help={
        fieldSchema.helpText ? (
          <DynamicText source={rootSource}>{fieldSchema.helpText}</DynamicText>
        ) : undefined
      }
    >
      <SchemaFieldOrInputContent schema={fieldSchema} source={source} showLabel={false} />
    </PropertyItem>
  );
};
