import {load} from 'js-yaml';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  ActionSchema,
  BoxSchema,
  FieldSchema,
  LocalResourceSchema,
  ResourceReference,
  ServiceSchema,
} from '@schema/types';
import {
  hasUnresolvedReferences,
  referenceKey,
  resolveReferences,
  resourceKey,
} from '../resourceReference';

const SERVICE = 'school';

// What the backend sends: a local reference leaves `service` out.
const local = (resource: string, extra: Partial<ResourceReference> = {}) =>
  ({resource, ...extra}) as ResourceReference;

const localSchema = (overrides: Partial<LocalResourceSchema> = {}): LocalResourceSchema => ({
  name: 'course',
  pkFieldName: 'id',
  views: [],
  actions: [],
  endpoints: {} as LocalResourceSchema['endpoints'],
  url: 'https://example.test/course/',
  ...overrides,
});

const listBox = (reference: ResourceReference): BoxSchema => ({
  name: 'students',
  type: 'list',
  readOnly: false,
  list: {reference},
});

const detailSchema = (box: BoxSchema) =>
  localSchema({
    views: [
      {
        name: 'show',
        type: 'show',
        isDetail: true,
        endpoint: {method: 'get'},
        detail: {box},
      },
    ],
  });

describe('resourceKey', () => {
  it('composes the service/resource key', () => {
    expect(resourceKey({service: 'school', resource: 'teacher'})).toBe('school/teacher');
  });

  it('passes an absent reference through', () => {
    expect(resourceKey(undefined)).toBeUndefined();
  });
});

describe('referenceKey', () => {
  it('gives one key to the same address whatever order its params arrive in', () => {
    const base = {service: 'school', resource: 'teacher'};

    expect(referenceKey({...base, params: {variant: 'full', _target: 'course_id'}})).toBe(
      referenceKey({...base, params: {_target: 'course_id', variant: 'full'}})
    );
  });

  it('tells apart addresses that differ in a param', () => {
    const base = {service: 'school', resource: 'teacher'};

    expect(referenceKey({...base, params: {variant: 'full'}})).not.toBe(
      referenceKey({...base, params: {variant: 'short'}})
    );
  });

  it('tells apart an address with no params from one carrying some', () => {
    const base = {service: 'school', resource: 'teacher'};

    expect(referenceKey(base)).not.toBe(referenceKey({...base, params: {variant: 'full'}}));
  });

  it('tells apart the record, the action and the resource an address names', () => {
    const base = {service: 'school', resource: 'teacher'};
    const keys = [
      referenceKey(base),
      referenceKey({...base, recordPk: 7}),
      referenceKey({...base, actionName: 'approve'}),
      referenceKey({...base, resource: 'student'}),
    ];

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('resolveReferences', () => {
  it('fills the service of the loaded schema into a reference without one', () => {
    const schema = detailSchema(listBox(local('student')));
    const resolved = resolveReferences(schema, SERVICE);
    expect(resolved.views[0].detail?.box.list?.reference).toEqual({
      service: SERVICE,
      resource: 'student',
    });
  });

  it('keeps a service the backend named', () => {
    const foreign = {service: 'library', resource: 'book'};
    const schema = detailSchema(listBox(foreign));
    const resolved = resolveReferences(schema, SERVICE);
    expect(resolved.views[0].detail?.box.list?.reference).toBe(foreign);
  });

  it('keeps the other parts of the address', () => {
    const schema = detailSchema(
      listBox(local('student', {recordPk: 7, actionName: 'enroll', params: {_target: '{"a":1}'}}))
    );
    const resolved = resolveReferences(schema, SERVICE);
    expect(resolved.views[0].detail?.box.list?.reference).toEqual({
      service: SERVICE,
      resource: 'student',
      recordPk: 7,
      actionName: 'enroll',
      params: {_target: '{"a":1}'},
    });
  });

  it('leaves a descriptor without a reference without one', () => {
    const box: BoxSchema = {
      name: 'main',
      type: 'simple',
      readOnly: false,
      toolbarActions: [{name: 'edit'}],
    };
    const resolved = resolveReferences(detailSchema(box), SERVICE);
    expect(resolved.views[0].detail?.box.toolbarActions?.[0]).not.toHaveProperty('reference');
  });

  it('does not touch user data that happens to carry a reference key', () => {
    const userData = {reference: {resource: 'student'}};
    const field = {
      name: 'payload',
      type: 'object',
      defaultValue: userData,
    } as unknown as FieldSchema;
    const schema = localSchema({
      endpoints: {get: {fields: [field]}} as unknown as LocalResourceSchema['endpoints'],
      actions: [
        {
          name: 'archive',
          type: 'resource',
          isDetail: true,
          showInList: false,
          showInDetail: true,
          resource: {endpoint: {method: 'post'}, data: userData as never},
        },
      ],
    });
    const resolved = resolveReferences(schema, SERVICE);
    expect(resolved).toBe(schema);
    expect(userData.reference).toEqual({resource: 'student'});
  });

  it('returns the same object when nothing lacks a service', () => {
    const schema = detailSchema(listBox({service: SERVICE, resource: 'student'}));
    expect(resolveReferences(schema, SERVICE)).toBe(schema);
  });

  it('copies only the branches it changes and never mutates its input', () => {
    const untouched: BoxSchema = {name: 'info', type: 'simple', readOnly: false};
    const box: BoxSchema = {
      name: 'main',
      type: 'simple',
      readOnly: false,
      boxes: [untouched, listBox(local('student'))],
    };
    const schema = detailSchema(box);
    const snapshot = structuredClone(schema);

    const resolved = resolveReferences(schema, SERVICE);

    expect(schema).toEqual(snapshot);
    expect(resolved).not.toBe(schema);
    expect(resolved.views[0].detail?.box.boxes?.[0]).toBe(untouched);
    expect(resolved.endpoints).toBe(schema.endpoints);
  });
});

describe('the other entry points', () => {
  it('resolves a service schema', () => {
    const schema = [
      {
        name: 'course',
        pkFieldName: 'id',
        label: 'Course',
        views: [{name: 'list', type: 'list', isDetail: false, endpoint: {method: 'get'}}],
        actions: [],
        url: 'https://example.test/course/',
        menu: {
          name: 'course',
          label: 'Course',
          priority: 1,
          type: 'view',
          view: {
            name: 'list',
            choices: [],
            mode: 'redirect',
            parameters: {},
            endpoint: local('course'),
          },
        },
      },
    ] as ServiceSchema;
    expect(resolveReferences(schema, SERVICE)[0].menu?.view?.endpoint).toEqual({
      service: SERVICE,
      resource: 'course',
    });
  });

  it('resolves an action', () => {
    const action: ActionSchema = {
      type: 'upload-images',
      isDetail: true,
      uploadImages: {reference: local('photo'), imageField: 'file'},
    };
    expect(resolveReferences(action, SERVICE).uploadImages?.reference?.service).toBe(SERVICE);
  });

  it('resolves a field and the fields nested in it', () => {
    const field = {
      name: 'teachers',
      type: 'array',
      items: {type: 'integer', reference: local('teacher')},
    } as FieldSchema;
    expect(resolveReferences(field, SERVICE).items?.reference?.service).toBe(SERVICE);
  });

  it('resolves the actions a record carries and the action a response triggers', () => {
    const meta = {
      repr: 'Algebra',
      tags: [],
      schema: {
        name: 'course',
        pkFieldName: 'id',
        actions: [
          {
            name: 'open',
            type: 'view' as const,
            isDetail: true,
            showInList: true,
            showInDetail: true,
            view: {
              name: 'show',
              choices: [],
              mode: 'redirect' as const,
              parameters: {},
              endpoint: local('lesson'),
            },
          },
        ],
      },
      triggerAction: {
        type: 'view' as const,
        isDetail: false,
        view: {
          name: 'list',
          choices: [],
          mode: 'redirect' as const,
          parameters: {},
          endpoint: local('lesson'),
        },
      },
    };
    const resolved = resolveReferences(meta, SERVICE);
    expect(resolved.schema.actions[0].view?.endpoint?.service).toBe(SERVICE);
    expect(resolved.triggerAction.view?.endpoint?.service).toBe(SERVICE);
  });
});

describe('hasUnresolvedReferences', () => {
  it('reports a reference without a service', () => {
    expect(hasUnresolvedReferences(detailSchema(listBox(local('student'))))).toBe(true);
  });

  it('accepts a schema whose references all name their service', () => {
    const schema = detailSchema(listBox({service: SERVICE, resource: 'student'}));
    expect(hasUnresolvedReferences(schema)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Coverage against the contract: every property through which `contract/openapi.yaml` reaches a
// `ResourceReference` gets a generated fixture, and the walk must fill the service at its end.
// ---------------------------------------------------------------------------------------------

type ContractSchema = {
  type?: string;
  items?: unknown;
  additionalProperties?: unknown;
  properties?: Record<string, ContractSchema>;
  allOf?: ContractSchema[];
  $ref?: string;
  'x-habarico-tier'?: string;
};

// How the property holds its target: as itself, as list items, or as the values of a map.
type Holding = 'single' | 'array' | 'map';

type Edge = {from: string; property: string | null; to: string; holding: Holding};

const CONTRACT_PATH = resolve(__dirname, '../../../../../contract/openapi.yaml');
const contract = load(readFileSync(CONTRACT_PATH, 'utf8')) as {
  components: {schemas: Record<string, ContractSchema>};
};
const schemas = contract.components.schemas;

const refName = (ref: string) => ref.split('/').pop()!;

const refsIn = (node: unknown, found = new Set<string>()): Set<string> => {
  if (!node || typeof node !== 'object') return found;
  const {$ref} = node as {$ref?: unknown};
  if (typeof $ref === 'string') found.add(refName($ref));
  Object.values(node).forEach((value) => refsIn(value, found));
  return found;
};

const holdingOf = (value: ContractSchema): Holding => {
  if (value.type === 'array') return 'array';
  if (value.type === 'object' && typeof value.additionalProperties === 'object') return 'map';
  return 'single';
};

const edges: Edge[] = Object.entries(schemas).flatMap(([from, schema]) => [
  // `allOf` composes a schema into the same object rather than nesting it under a property
  ...(schema.allOf ?? []).flatMap((part) =>
    part.$ref ? [{from, property: null, to: refName(part.$ref), holding: 'single' as const}] : []
  ),
  ...[
    schema.properties ?? {},
    ...(schema.allOf ?? []).map((part) => part.properties ?? {}),
  ].flatMap((properties) =>
    Object.entries(properties).flatMap(([property, value]) =>
      [...refsIn(value)].map((to) => ({
        from,
        property,
        to,
        holding: holdingOf(value),
      }))
    )
  ),
]);

const reachesReference = new Set(['ResourceReference']);
for (let grew = true; grew; ) {
  grew = false;
  for (const edge of edges) {
    if (reachesReference.has(edge.to) && !reachesReference.has(edge.from)) {
      reachesReference.add(edge.from);
      grew = true;
    }
  }
}

const isEnterprise = (name: string) => schemas[name]['x-habarico-tier'] === 'enterprise';

// Wrappers whose `meta` the data provider hands to `resolveReferences` on its own.
const UNWRAPPED_BY_DATA_PROVIDER = new Set([
  'ResourceObject',
  'ResourceObjectList',
  'ActionResult',
]);

const ROOTS: Record<string, (value: never) => unknown> = {
  GlobalResourceSchema: (value: ServiceSchema[number]) => resolveReferences([value], SERVICE)[0],
  LocalResourceSchema: (value: LocalResourceSchema) => resolveReferences(value, SERVICE),
  ResourceObjectMeta: (value: object) => resolveReferences(value, SERVICE),
  ActionResultMeta: (value: object) => resolveReferences(value, SERVICE),
};

// What a generated object needs besides the property on the path: discriminators the walk reads,
// and required parts it reads unconditionally.
const SHAPES: Record<string, object> = {
  FieldDescriptor: {type: 'field', name: 'title'},
  ActionDescriptor: {type: 'action', name: 'approve'},
  DefaultActionsDescriptor: {type: 'default_actions'},
  BoxSchema: {type: 'simple', name: 'main'},
  ActionSchema: {type: 'view'},
  ResourceActionSchema: {type: 'view'},
  ListBoxParameters: {reference: {service: SERVICE, resource: 'student'}},
  GalleryBoxParameters: {reference: {service: SERVICE, resource: 'photo'}, imageField: 'file'},
  DetailViewParameters: {box: {type: 'simple', name: 'main'}},
  ResourceActionParameters: {endpoint: {method: 'post'}},
  ResourceActionEndpointParameters: {method: 'post'},
  ViewEndpointParameters: {method: 'get'},
};

const camelCase = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const shortestPath = (from: string, to: string, allowed: Edge[]): Edge[] | undefined => {
  const queue: [string, Edge[]][] = [[from, []]];
  const seen = new Set([from]);
  while (queue.length) {
    const [node, path] = queue.shift()!;
    if (node === to) return path;
    for (const edge of allowed.filter((e) => e.from === node && !seen.has(e.to))) {
      seen.add(edge.to);
      queue.push([edge.to, [...path, edge]]);
    }
  }
  return undefined;
};

const relevant = edges.filter(
  (edge) =>
    reachesReference.has(edge.to) &&
    !isEnterprise(edge.from) &&
    !UNWRAPPED_BY_DATA_PROVIDER.has(edge.from)
);

const pathFromRoot = (schema: string) =>
  Object.keys(ROOTS)
    .map((root) => ({root, path: shortestPath(root, schema, relevant)}))
    .filter((found) => found.path)
    .sort((a, b) => a.path!.length - b.path!.length)[0];

// Builds the object a path describes, with a local reference at its end, and the accessor to it.
const buildFixture = (path: Edge[]) => {
  let value: unknown = {resource: 'target'};
  const accessor: (string | number)[] = [];
  for (const edge of [...path].reverse()) {
    const shape = SHAPES[edge.from] ?? {};
    if (edge.property === null) {
      value = {...shape, ...(value as object)};
      continue;
    }
    const key = camelCase(edge.property);
    if (edge.holding === 'array') {
      value = {...shape, [key]: [value]};
      accessor.unshift(key, 0);
    } else if (edge.holding === 'map') {
      value = {...shape, [key]: {entry: value}};
      accessor.unshift(key, 'entry');
    } else {
      value = {...shape, [key]: value};
      accessor.unshift(key);
    }
  }
  return {value, accessor};
};

const at = (value: unknown, accessor: (string | number)[]) =>
  accessor.reduce<unknown>((node, key) => (node as Record<string | number, unknown>)[key], value);

const edgeLabel = (edge: Edge) =>
  edge.property === null ? `${edge.from} (allOf ${edge.to})` : `${edge.from}.${edge.property}`;

describe('coverage of contract/openapi.yaml', () => {
  it('reaches every schema leading to a ResourceReference from a resolved entry point', () => {
    const unreachable = relevant.filter((edge) => !pathFromRoot(edge.from)).map(edgeLabel);
    expect(unreachable).toEqual([]);
  });

  it.each(relevant.map((edge) => [edgeLabel(edge), edge]))(
    'fills the service through %s',
    (_, edge) => {
      const {root, path: toEdge} = pathFromRoot(edge.from)!;
      const fromEdge =
        edge.to === 'ResourceReference'
          ? []
          : shortestPath(edge.to, 'ResourceReference', relevant)!;
      const {value, accessor} = buildFixture([...toEdge!, edge, ...fromEdge]);

      const resolved = ROOTS[root](value as never);

      expect(at(resolved, accessor)).toEqual({service: SERVICE, resource: 'target'});
    }
  );
});
