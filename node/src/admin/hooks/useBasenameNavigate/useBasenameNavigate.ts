import {useCallback} from 'react';
import {removeDoubleSlashes, useBasename} from 'react-admin';
import {NavigateOptions, useNavigate} from 'react-router-dom';

/**
 * react-router's `navigate` is unaware of react-admin's basename (it lives in
 * BasenameContext, not on the router), so navigating to a hardcoded absolute path
 * such as '/logout' would miss the basename and land outside the admin mount.
 * This wrapper prefixes absolute string targets with the basename.
 */
export const useBasenameNavigate = () => {
  const navigate = useNavigate();
  const basename = useBasename();

  return useCallback(
    (to: string, options?: NavigateOptions) =>
      navigate(removeDoubleSlashes(`${basename}${to}`), options),
    [navigate, basename]
  );
};
