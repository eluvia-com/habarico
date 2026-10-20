import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // habarico is linked from ../../../node, which has its own node_modules: one copy of each peer.
    dedupe: [
      'react', 'react-dom', 'react-admin', 'ra-core', 'ra-ui-materialui', 'ra-i18n-polyglot',
      'react-router', 'react-router-dom', 'react-hook-form', '@tanstack/react-query',
      '@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@mui/x-charts',
      '@mui/x-date-pickers', '@mui/x-tree-view', '@emotion/react', '@emotion/styled',
    ],
  },
  server: {
    // One origin for the admin and the API, so the session cookie reaches both.
    proxy: {'/api': process.env.API_URL ?? 'http://localhost:8000'},
  },
});
