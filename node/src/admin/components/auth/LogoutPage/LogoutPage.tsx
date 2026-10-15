import React, {useEffect, useRef} from 'react';
import {useLogout} from 'react-admin';
import {Loading} from '../../common/Loading';

export const LogoutPage = () => {
  const logout = useLogout();
  const loggedOut = useRef(false);

  useEffect(() => {
    if (!loggedOut.current) {
      loggedOut.current = true;
      logout({}, undefined, false);
    }
  }, [logout]);

  return <Loading />;
};
