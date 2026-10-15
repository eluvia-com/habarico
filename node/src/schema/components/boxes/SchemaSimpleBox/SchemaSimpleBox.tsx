import React, {useMemo} from 'react';
import {DynamicText} from '@admin/components/common/DynamicText';
import {useIsLastPanel} from '@design/contexts/IsLastPanelContext';
import {BoxLayout, useBoxCard} from '@schema/components/boxes/BoxLayout';
import {SchemaBoxChildren} from '@schema/components/boxes/SchemaBoxChildren';
import {SchemaBoxProps} from '@schema/components/boxes/types';
import {SchemaButtons} from '@schema/components/buttons/SchemaButtons';
import {ParentBoxProvider, useParentBoxContext} from '@schema/contexts/ParentBoxContext';
import {hasFieldDescriptors, isBoxSchema} from '@schema/utils/api';

export const SchemaSimpleBox = ({
  schema,
  excludeFields,
  label = schema.label,
  isRoot,
}: SchemaBoxProps) => {
  const {getBoxName, isHidden} = useParentBoxContext();
  const parentBoxName = getBoxName(schema.name);
  // Whether this box is on the "last path" of the layout (last child of its parent,
  // whose parent is itself last, ...). Only such a box may grow to fill height;
  // otherwise a non-last box would stretch and push its siblings toward the centre.
  const isLast = useIsLastPanel();

  const hasToolbarActions = !!schema.toolbarActions?.length;
  const hasBottomActions = !!schema.bottomActions?.length;

  // A box that contains a nested box must fill its height so the fill propagates down to that
  // child (whose own toolbar/content needs to reach the real bottom). A box with only fields stays
  // natural — filling would stretch the inputs. And it only fills when it is the last box on its
  // path, so earlier boxes keep their natural height instead of growing.
  const hasNestedBox = (schema.boxes || []).some(isBoxSchema);
  const fill = hasNestedBox && isLast;

  // Card chrome whenever the box carries a label, has header actions or is collapsible — plus the
  // root box on a page, but only while it holds fields of its own; a bare wrapper hands that
  // default down to its children instead. `schema.card` overrides both ways.
  const boxes = schema.boxes || [];
  const card = useBoxCard(
    schema,
    Boolean(label || hasToolbarActions || schema.collapsible),
    isRoot && hasFieldDescriptors(boxes)
  );
  // A card stops the hand-down: whatever this box draws is the surface its children sit on.
  const childIsRoot = isRoot && !card;

  // Memoized: `ParentBoxProvider` doesn't memoize its own `value` — a fresh object here on every
  // render (as before) invalidates the context for every descendant regardless of whether anything
  // actually changed, forcing this box's whole subtree to re-render on any unrelated re-render.
  const parentBoxValue = useMemo(
    () => ({parentBoxName, parentBoxSchema: schema, isHidden}),
    [parentBoxName, schema, isHidden]
  );

  return (
    <BoxLayout
      schema={schema}
      card={card}
      label={label ? <DynamicText>{label}</DynamicText> : undefined}
      action={
        hasToolbarActions ? (
          <SchemaButtons
            size="small"
            variant="contained"
            maxVisibleButtons={{xs: 1, sm: 2, md: 3, lg: 5}}
            iconOnly="sm"
            descriptors={schema.toolbarActions}
          />
        ) : undefined
      }
      footerRight={
        hasBottomActions ? (
          <SchemaButtons size="medium" variant="contained" descriptors={schema.bottomActions} />
        ) : undefined
      }
      fullHeight={fill}
    >
      <ParentBoxProvider value={parentBoxValue}>
        <SchemaBoxChildren
          boxes={boxes}
          excludeFields={excludeFields}
          fill={fill}
          isRoot={childIsRoot}
        />
      </ParentBoxProvider>
    </BoxLayout>
  );
};
