import React from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useResourceContext} from '@admin/contexts/ResourceContext';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {DynamicRequiredWrapper} from '@schema/components/dynamic/DynamicRequiredWrapper';
import {ReadOnlyBoxProvider} from '@schema/contexts/ReadOnlyBoxContext';
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

  // `read_only: true` on the box closes its whole subtree, not just the box's own leaves: every
  // nested box and field below renders as a value even though the view is an `edit` / `create`
  // one. Scoped here, around the dispatched element, so it holds for every box type rather than
  // each one having to remember it.
  return (
    <ReadOnlyBoxProvider readOnly={Boolean(schema.readOnly)}>
      <DynamicRequiredWrapper requiredQuery={schema.options?.dynamicRender?.requiredQuery}>
        {boxEl}
      </DynamicRequiredWrapper>
    </ReadOnlyBoxProvider>
  );
};

// Memoized: none of `schema`/`label`/`excludeFields`/`isRoot` change when a sibling flips (e.g. a
// tab box's `isActive`, which isn't even passed down here) — without this, every box re-generates
// its element tree via `defaultBoxProvider` on every render of its parent, whether or not anything
// it actually renders from changed.
export const SchemaBoxBody = React.memo(SchemaBoxBodyComponent);
