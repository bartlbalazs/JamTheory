import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
//
// Environment resolution:
//   - Dev/test: `src/environments/environment.ts` re-exports `src/env.ts`,
//     which reads `VITE_*` env vars (see env.ts).
//   - Prod build: `deploy.sh --hosting` overwrites `environment.prod.ts`
//     with real API Gateway + Firebase config, then runs `npm run build`.
//     A top-level `index.ts` resolves to the right one via mode.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
