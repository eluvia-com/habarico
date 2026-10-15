import React from 'react';
import {useAdminConfig} from '@admin/contexts/AdminConfigContext';
import {AuthPage} from '../../auth/AuthPage';

// Stable auth page passed to `<Admin loginPage>` — the design auth shell, fed from the config.
export const BaseAdminAuthPage = () => {
  const config = useAdminConfig();
  return <AuthPage logo={config.logo} availableLanguages={config.availableLanguages} />;
};
