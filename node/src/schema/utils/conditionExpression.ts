import jsep from 'jsep';
import {get} from 'lodash-es';

// Evaluates `showQuery` / `requiredQuery` schema expressions without ever compiling code
// (`new Function` / `eval`), so a schema expression cannot execute JavaScript in the admin
// session and the app can run under a CSP without `unsafe-eval` (HAB-901).
//
// Supported grammar: identifiers with dot paths resolved against the data object, string /
// number / boolean / `null` / `undefined` literals, `==` `!=` `===` `!==` `<` `<=` `>` `>=`
// comparisons, `!`, `&&` / `||` and parentheses. Anything else — calls, computed access,
// arithmetic, assignments — is rejected at parse time.
//
// jsep's module-level operator configuration is deliberately left untouched: it is shared
// state, and mutating it would leak into a consuming app that also uses jsep. The whitelist
// below is the only gate.

const BINARY_OPERATORS = new Set(['==', '!=', '===', '!==', '<', '<=', '>', '>=', '&&', '||']);
const UNARY_OPERATORS = new Set(['!', '-']);
// Walking the prototype chain never has a legitimate use in a condition over record data.
const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

const invalid = (): never => {
  throw new Error('Invalid expression.');
};

const identifierName = (node: jsep.Expression): string => {
  if (node.type !== 'Identifier') invalid();
  const {name} = node as jsep.Identifier;
  if (FORBIDDEN_PATH_SEGMENTS.has(name)) invalid();
  return name;
};

// Resolves a non-computed member chain (`record.status`) to the dot path `get` understands.
const toPath = (node: jsep.Expression): string => {
  if (node.type === 'MemberExpression') {
    const member = node as jsep.MemberExpression;
    if (member.computed) invalid();
    return `${toPath(member.object)}.${identifierName(member.property)}`;
  }
  return identifierName(node);
};

const validateNode = (node: jsep.Expression): void => {
  switch (node.type) {
    case 'Literal':
      return;
    case 'Identifier':
    case 'MemberExpression':
      toPath(node);
      return;
    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      if (!UNARY_OPERATORS.has(unary.operator)) invalid();
      validateNode(unary.argument);
      return;
    }
    case 'BinaryExpression': {
      const binary = node as jsep.BinaryExpression;
      if (!BINARY_OPERATORS.has(binary.operator)) invalid();
      validateNode(binary.left);
      validateNode(binary.right);
      return;
    }
    default:
      invalid();
  }
};

export const parseConditionExpression = (expression: string): jsep.Expression => {
  let ast: jsep.Expression;
  try {
    ast = jsep(expression);
  } catch {
    return invalid();
  }
  validateNode(ast);
  return ast;
};

// A schema's set of distinct `showQuery`/`requiredQuery` strings is fixed for the lifetime of the
// page (they come from the fetched schema, not from user input), so caching the parsed AST per
// expression is safe to keep for as long as the app runs — there is no unbounded key growth.
const astCache = new Map<string, jsep.Expression>();

export const getCachedConditionAst = (expression: string): jsep.Expression => {
  const cached = astCache.get(expression);
  if (cached) return cached;
  const ast = parseConditionExpression(expression);
  astCache.set(expression, ast);
  return ast;
};

export type ConditionDependencies = {
  // Dot paths relative to `data`/`formData` (e.g. `data.is_company` -> `is_company`) that the
  // expression reads — what a caller should scope a `useWatch({name: [...]})` to.
  paths: string[];
  // True when the expression can't be safely narrowed (references `parent`, or any root other than
  // the known `data` / `formData` / `record` / `viewData` namespace) — the caller must fall back to
  // watching the whole form for this expression instead of trusting a partial `paths` list.
  unscoped: boolean;
};

type MutableDependencies = {paths: Set<string>; unscoped: boolean};

// Mirrors `evaluateNode`'s traversal shape, collecting `data.`/`formData.` paths instead of
// evaluating. `record.` / `viewData.` roots are intentionally dropped: they come from the current
// record/view, not from `useWatch`, so they never need to be watched. Anything else — `parent`
// (ancestor-scope access), or an unrecognized root — marks the whole expression `unscoped` rather
// than reporting a partial (and therefore unsafe) dependency list.
const collectDependencies = (node: jsep.Expression, deps: MutableDependencies): void => {
  if (deps.unscoped) return;
  switch (node.type) {
    case 'Literal':
      return;
    case 'Identifier':
    case 'MemberExpression': {
      const path = toPath(node);
      const dotIndex = path.indexOf('.');
      const root = dotIndex === -1 ? path : path.slice(0, dotIndex);
      const rest = dotIndex === -1 ? '' : path.slice(dotIndex + 1);
      if ((root === 'data' || root === 'formData') && rest) {
        deps.paths.add(rest);
      } else if (root === 'record' || root === 'viewData') {
        // not reactive — nothing to watch
      } else {
        deps.unscoped = true;
      }
      return;
    }
    case 'UnaryExpression':
      collectDependencies((node as jsep.UnaryExpression).argument, deps);
      return;
    default: {
      const {left, right} = node as jsep.BinaryExpression;
      collectDependencies(left, deps);
      collectDependencies(right, deps);
    }
  }
};

const dependenciesCache = new Map<string, ConditionDependencies>();

export const getConditionDependencies = (expression: string): ConditionDependencies => {
  const cached = dependenciesCache.get(expression);
  if (cached) return cached;

  const deps: MutableDependencies = {paths: new Set(), unscoped: false};
  try {
    collectDependencies(getCachedConditionAst(expression), deps);
  } catch {
    // An expression that fails to parse can't be scoped either; `createConditionFunction` already
    // returns `false` for it at evaluation time, so falling back to a full watch is harmless here.
    deps.unscoped = true;
  }

  const result: ConditionDependencies = {paths: [...deps.paths], unscoped: deps.unscoped};
  dependenciesCache.set(expression, result);
  return result;
};

const evaluateNode = (node: jsep.Expression, data: object): unknown => {
  switch (node.type) {
    case 'Literal':
      return (node as jsep.Literal).value;
    case 'Identifier': {
      const {name} = node as jsep.Identifier;
      // `true` / `false` / `null` are jsep literals; `undefined` stays an identifier, but the
      // grammar has no globals, so it can only mean the constant.
      if (name === 'undefined') return undefined;
      return get(data, name);
    }
    case 'MemberExpression':
      return get(data, toPath(node));
    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      const value = evaluateNode(unary.argument, data);
      return unary.operator === '!' ? !value : -(value as number);
    }
    default: {
      const {operator, left, right} = node as jsep.BinaryExpression;
      // `&&` / `||` short-circuit like in JavaScript
      if (operator === '&&') return evaluateNode(left, data) && evaluateNode(right, data);
      if (operator === '||') return evaluateNode(left, data) || evaluateNode(right, data);
      const a = evaluateNode(left, data) as never;
      const b = evaluateNode(right, data) as never;
      switch (operator) {
        // loose equality is part of the expression grammar
        case '==':
          return a == b;
        case '!=':
          return a != b;
        case '===':
          return a === b;
        case '!==':
          return a !== b;
        case '<':
          return a < b;
        case '<=':
          return a <= b;
        case '>':
          return a > b;
        default:
          return a >= b;
      }
    }
  }
};

export const evaluateConditionExpression = (ast: jsep.Expression, data: object): boolean =>
  Boolean(evaluateNode(ast, data));
