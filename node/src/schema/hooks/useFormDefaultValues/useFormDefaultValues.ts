import {useMemo} from 'react';
import {useViewSchemaContext} from '@schema/contexts/ViewSchemaContext/useViewSchemaContext';
import {BoxItem, BoxSchema} from '@schema/types';
import {buildBoxDefaultValues, collectFieldDescriptors, isBoxSchema} from '@schema/utils/api';
import {generateFieldSchemaMap} from '@schema/utils/generateFieldSchemaMap';
import {DefaultValues} from '@typing';

export const useFormDefaultValues = (): DefaultValues | undefined => {
  const {viewSchema, methodSchema} = useViewSchemaContext();

  const descriptors = useMemo(
    () => (viewSchema.detail?.box ? collectFieldDescriptors(viewSchema.detail.box) : []),
    [viewSchema]
  );

  const fieldSchemaMap = generateFieldSchemaMap(methodSchema.fields, descriptors);

  return useMemo(() => {
    if (!viewSchema.detail?.box) return undefined;

    const defaults: DefaultValues = {};
    let hasAny = false;

    // Top-level field defaults.
    Object.values(fieldSchemaMap).forEach((schema) => {
      if (schema.defaultValue !== undefined) {
        defaults[schema.name] = schema.defaultValue;
        hasAny = true;
      }
    });

    // Processes a single non-nullable object box: builds its nested defaults and
    // assigns them into target. buildBoxDefaultValues handles internal nesting.
    const collectObjectBoxDefaults = (box: BoxSchema) => {
      if (box.type !== 'object' || !box.object?.target) return;
      const subTarget = box.object.target;
      const targetSchema = methodSchema.fields.find((f) => f.name === subTarget);
      const properties = targetSchema?.properties;
      if (!properties || !targetSchema || targetSchema.nullable) return;

      defaults[subTarget] = Object.assign(
        (defaults[subTarget] as DefaultValues) ?? {},
        buildBoxDefaultValues(box, properties)
      );
      hasAny = true;
    };

    // Traverses the box tree calling collectObjectBoxDefaults for each object box found.
    const traverseBoxForObjects = (item: BoxItem) => {
      if (!isBoxSchema(item)) return;
      if (item.type === 'object') {
        collectObjectBoxDefaults(item);
      } else if (item.type !== 'array' && item.type !== 'list') {
        item.boxes?.forEach(traverseBoxForObjects);
      }
    };

    traverseBoxForObjects(viewSchema.detail.box);

    return hasAny ? defaults : undefined;
  }, [fieldSchemaMap, viewSchema, methodSchema]);
};
