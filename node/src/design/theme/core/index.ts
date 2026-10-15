// Side-effect: loads the `theme.iconSet` module augmentation so consumers of this barrel
// (and the `Icon` component) can see `theme.iconSet` without importing it separately.
import './iconSet';

export * from './shadows';
export * from './palette';
export * from './typography';
export * from './components';
export * from './customShadows';
export * from './layout';
export * from './radius';
