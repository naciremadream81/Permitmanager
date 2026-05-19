import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@permitpro/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@permitpro/permit-engine': path.resolve(__dirname, '../../packages/permit-engine/src/index.ts'),
    },
  },
});
