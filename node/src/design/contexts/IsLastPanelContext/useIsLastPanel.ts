import {useContext} from 'react';
import {IsLastPanelContext} from './IsLastPanelContext';

// Whether this panel sits on the "last path": the last child of its parent, whose
// parent is itself the last child, and so on up to the root. Defaults to true when
// no provider exists (the outermost panel). Only last-path items get flex-grow, so
// earlier siblings keep their natural size instead of stretching and pushing the
// rest of the content down.
export const useIsLastPanel = () => useContext(IsLastPanelContext) ?? true;
