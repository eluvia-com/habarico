import React, {useEffect} from 'react';
import {useNotify, useTranslate} from 'react-admin';
import {useLocation, useNavigate} from 'react-router-dom';
import {LoginSsoMethod} from '@admin/providers/types';
import {Box, CircularProgress, IconButton, Tooltip} from '@mui/material';

type LoginSsoMethodButtonProps = {
  method: LoginSsoMethod;
  onSuccess?: () => void;
};

/**
 * Renders one registered `LoginSsoMethod` as an icon-only button (matching the design-layer auth
 * shell, which lays the SSO providers out as a centred row of `IconButton`s). Calls the method's
 * `useLogin` hook with the routing context and, while it processes the provider's redirect callback
 * or a click-triggered sign-in, shows a spinner in the button's place.
 */
export const LoginSsoMethodButton = ({method, onSuccess}: LoginSsoMethodButtonProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const translate = useTranslate();
  const notify = useNotify();

  const {isCallback, loading, error, login} = method.useLogin({
    location,
    redirectPath: location.pathname,
    onSuccess,
  });

  // Surface sign-in failures via the global notification instead of replacing the button, and
  // clear the OAuth callback params so isCallback resets and the user returns to a clean login
  // form to retry. The router state (which carries the next page) is kept intact.
  useEffect(() => {
    if (error) {
      notify('ra.auth.sign_in_error', {type: 'error'});
      navigate(location.pathname, {replace: true, state: location.state});
    }
  }, [error, notify, navigate, location.pathname, location.state]);

  // While processing the OAuth callback (and not after a failure) or a click-triggered sign-in,
  // show a spinner sized to the icon button's footprint so the row layout stays stable.
  if ((isCallback && !error) || loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" width={40} height={40}>
        <CircularProgress size={24} color="inherit" />
      </Box>
    );
  }

  const label = translate(method.label, {_: method.label});
  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={login} aria-label={label}>
        {method.icon}
      </IconButton>
    </Tooltip>
  );
};
