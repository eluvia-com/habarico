// Foundation layer — the non-visual shared kernel of the library.
// See ./README.md for the layer's purpose, rules and structure.
//
// Framework/UI-agnostic: NO MUI, NO theme, NO react-admin, NO schema. Holds shared
// types, pure utilities, i18n data and non-visual navigation hooks. It is the bottom
// layer — it NEVER imports "up" (design / admin / schema).
//
// Leaf modules can also be imported by sub-path (`@foundation/utils/globMatch`,
// `@foundation/hooks/usePathname`); the genuinely public members are re-exported here.

// Hooks
export * from './hooks/useFileModifier';
export * from './hooks/usePathname';
export * from './hooks/useRouter';
export * from './hooks/useTabsLocation';

// Utils
export * from './utils/file';
export * from './utils/form';
export * from './utils/globMatch';
export * from './utils/image';
export * from './utils/locale';
export * from './utils/localflavor';
export * from './utils/navigation';
export * from './utils/template';
export * from './utils/upload';
