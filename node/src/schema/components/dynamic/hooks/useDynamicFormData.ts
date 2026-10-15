import {set} from 'lodash-es';
import {useRecordContext, useSourceContext} from 'react-admin';
import {useWatch} from 'react-hook-form';
import {useRootRecordContext} from '@admin/contexts/RootRecordContext';
import {useSchemaViewRouterContext} from '@schema/contexts/SchemaViewRouterContext/useSchemaViewRouterContext';
import {getConditionDependencies} from '@schema/utils/conditionExpression';
import {DataType} from '@typing';
import {DynamicViewDataType} from './types';
import {getDataTree} from './utils';

// Builds the sparse `formData` object a scoped watch can safely hand to `getDataTree`: only the
// leaf paths a condition actually reads are set, at the same nested shape `get(formData, path)`
// would see on the real form — that is all `evaluateConditionExpression` ever looks at.
const buildScopedFormData = (names: string[], values: unknown[]): DataType => {
  const formData: DataType = {};
  names.forEach((name, index) => set(formData, name, values[index]));
  return formData;
};

// `queries` are the `showQuery`/`requiredQuery` expressions the caller is about to evaluate against
// this hook's result. Watching the whole form on every one of them (the old behavior) is what made
// typing into any field re-render every dynamicRender field in a large form: this narrows the
// `useWatch` subscription to only the fields those expressions actually read, falling back to a
// full-form watch only when an expression references `parent` (or anything else that can't be
// resolved to a concrete field path) — see `getConditionDependencies`.
export const useDynamicFormData = (queries: (string | undefined)[]): DynamicViewDataType => {
  const {getSource} = useSourceContext();
  const source = getSource('');

  const paths = new Set<string>();
  let unscoped = false;
  for (const query of queries) {
    if (!query) continue;
    const dependencies = getConditionDependencies(query);
    if (dependencies.unscoped) {
      unscoped = true;
      break;
    }
    dependencies.paths.forEach((path) => paths.add(path));
  }

  const qualifiedNames = [...paths].map((path) => (source ? `${source}.${path}` : path));

  // `unscoped`/`qualifiedNames` depend only on `queries` — fixed per instance, since they come from
  // the static schema, not from live form values — so this always calls `useWatch` exactly once;
  // only its `name` argument varies between renders of different instances. React-hook-form picks
  // the "watch everything" vs. "watch these paths" branch purely at runtime, off whether `name` is
  // `undefined` or an array, so the cast below doesn't change what actually gets watched.
  const watched = useWatch({name: (unscoped ? undefined : qualifiedNames) as string[]});

  const formData: DataType | undefined = unscoped
    ? (watched as DataType | undefined)
    : buildScopedFormData(qualifiedNames, watched as unknown[]);

  const {data: viewData} = useSchemaViewRouterContext();
  const rootRecord = useRootRecordContext();
  const record = useRecordContext();

  return {
    viewData,
    ...getDataTree({source, rootRecord, formData, record, viewData}),
  };
};
