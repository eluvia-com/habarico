import React, {useMemo} from 'react';
import {useDynamicFormData} from '@schema/components/dynamic/hooks/useDynamicFormData';
import {BoxSchema} from '@schema/types';
import {createConditionFunction, isBoxSchema} from '@schema/utils/api';
import {DynamicBoxSchemaComponentWrapperProps} from './types';

/**
 * A wrapper component that dynamically renders boxe component based on conditions in a form context.
 * The child boxes are filtered according to their `dynamicRender.showQuery` conditions, which are evaluated against the current form data, record data, and view data.
 */
export const FormDynamicBoxSchemaComponentWrapper = ({
  schema,
  component,
  ...props
}: DynamicBoxSchemaComponentWrapperProps) => {
  const boxQueries = (schema.boxes || []).map((box) =>
    isBoxSchema(box) ? (box as BoxSchema).options?.dynamicRender?.showQuery : undefined
  );
  const data = useDynamicFormData(boxQueries);

  const showBox = (box: BoxSchema) => {
    const dynamicRenderQuery = box.options?.dynamicRender?.showQuery;

    return !dynamicRenderQuery || createConditionFunction(dynamicRenderQuery)(data);
  };

  // Not keyed on `data`: `useWatch` returns a fresh object every render pass, so a `useMemo` on it
  // would recompute anyway. The filter is cheap to redo; what has to stay stable is the array
  // reference, so `useMemo` is keyed on the signature instead of on `filtered` itself — it is
  // swapped only when the set of visible box names changes. Everything keyed on `componentSchema`
  // downstream then sees a change only when a box's visibility actually flipped.
  const filtered = (schema.boxes || []).filter(
    (box) => isBoxSchema(box) && showBox(box as BoxSchema)
  );
  const signature = filtered.map((box) => box.name).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on signature, not filtered, on purpose
  const boxes = useMemo(() => filtered, [signature]);

  const componentSchema = useMemo(() => ({...schema, boxes}), [schema, boxes]);

  return React.createElement(component, {...props, schema: componentSchema});
};
