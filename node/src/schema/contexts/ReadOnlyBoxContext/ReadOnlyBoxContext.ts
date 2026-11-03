import {createContext} from 'react';

/**
 * Whether the surrounding box subtree renders read-only, regardless of the view it sits in. `false`
 * is the default, so a component outside any read-only box falls back to the view's own mode.
 */
export const ReadOnlyBoxContext = createContext<boolean>(false);
