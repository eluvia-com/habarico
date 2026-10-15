import React from 'react';
import {Loading as RaLoading} from 'react-admin';

// Full-viewport loading indicator — a thin restyle of React Admin's `Loading`. Admin-generic
// (schema-agnostic), used by the admin boot (`BaseAdmin` / auth routes) and the schema layer alike.
export const Loading = () => {
  return <RaLoading sx={{height: '100vh'}} />;
};
