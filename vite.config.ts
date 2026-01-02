import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@png': path.resolve(__dirname, 'src/png'),
      '@structural': path.resolve(__dirname, 'src/structural'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
