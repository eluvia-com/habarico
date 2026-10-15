import {useContext} from 'react';
import {InsidePanelContext} from './InsidePanelContext';

// Whether this subtree already sits inside a card-bearing `Panel`. A `Panel` provides
// `true` to its descendants; a `Section` is transparent (leaves the value untouched),
// so a Section never turns its subtree "nested". Defaults to false when no provider
// exists (the outermost panel is a root). A nested Panel reads this to auto-pick its
// `nested` variant, so callers rarely need to pass `variant` by hand. Safe outside any
// provider - it just reports a root context - so standalone panels (e.g. dashboard
// widgets) never crash.
export const useInsidePanel = () => useContext(InsidePanelContext) ?? false;
