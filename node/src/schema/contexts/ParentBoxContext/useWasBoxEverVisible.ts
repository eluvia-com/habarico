import {useState} from 'react';
import {useParentBoxContext} from './useParentBoxContext';

/**
 * `true` once the box has been on screen at least once, and sticky from then on: a box that has
 * been shown stays "visible" even after its tab is switched away, so it is not unmounted and does
 * not have to fetch everything again on the way back.
 *
 * The state is adjusted during render rather than in an effect — the pattern React documents for
 * deriving state from a changing prop or context value (https://react.dev/learn/you-might-not-need-an-effect).
 * React restarts the render before committing, so there is no extra browser paint.
 */
export const useWasBoxEverVisible = (): boolean => {
  const {isHidden} = useParentBoxContext();
  const [wasVisible, setWasVisible] = useState(!isHidden);

  if (!isHidden && !wasVisible) setWasVisible(true);

  return !isHidden || wasVisible;
};
