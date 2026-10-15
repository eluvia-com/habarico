import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {DynamicRequiredWrapper} from '@schema/components/dynamic/DynamicRequiredWrapper';
import {useGetBox} from '@schema/contexts/ResourceBoxContext/useGetBox';

/**
 * `SchemaBox` without its own `showQuery` check, for a container that owns the box's slot and has
 * already evaluated the query itself: a `SchemaGridBox` cell, or a tab/wizard step that
 * `DynamicBoxSchemaComponentWrapper` has filtered.
 */
const SchemaBoxBodyComponent = ({schema, label, excludeFields, isRoot}: SchemaBoxProps) => {
  const getBoxEl = useGetBox();
  const resource = useResourceContext();

  const boxProps = {
    label: label && <DynamicText>{label}</DynamicText>,
    schema: schema,
    isRoot,
  };

  const boxEl = getBoxEl({resource, schema, excludeFields, props: boxProps});
  if (!boxEl) return null;

  return (
    <DynamicRequiredWrapper requiredQuery={schema.options?.dynamicRender?.requiredQuery}>
      {boxEl}
    </DynamicRequiredWrapper>
  );
};

// Memoized: none of `schema`/`label`/`excludeFields`/`isRoot` change when a sibling flips (e.g. a
// tab box's `isActive`, which isn't even passed down here) — without this, every box re-generates
// its element tree via `defaultBoxProvider` on every render of its parent, whether or not anything
// it actually renders from changed.
export const SchemaBoxBody = React.memo(SchemaBoxBodyComponent);
