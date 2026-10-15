const escapeRegex = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compile = (pattern: string): RegExp => {
  const body = pattern
    .split('**')
    .map((part) => part.split('*').map(escapeRegex).join('[^.]+'))
    .join('.+');
  return new RegExp(`^${body}$`);
};

export const matchesAnyGlob = (key: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => compile(pattern).test(key));
