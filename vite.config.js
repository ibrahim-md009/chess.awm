import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the production build portable (works from any sub-path
// or static host without extra configuration).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
