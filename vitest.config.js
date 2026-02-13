import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js', 'tests/**/*.test.jsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: [
        'src/**/index.js',
        'src/main.jsx',
        'src/desktop/**',
        'src/ui/**',
        'src/config/**',
        // Modules queued for future dedicated test suites.
        'src/core/crossSection.js',
        'src/core/drawingOutput.js',
        'src/core/entityFactory.js',
        'src/core/layerRendering.js',
        'src/core/pdfExport.js',
        'src/core/result.js',
        'src/core/selection.js',
        'src/core/snapPoints.js',
        'src/core/spatialIndex.js',
        'src/core/types.js',
        'src/png/cadIntegration.js',
        'src/png/landowners.js',
        'src/png/roads.js',
        'src/png/safety.js',
        'src/png/structural.js',
        'src/png/terrain.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@png': path.resolve(__dirname, 'src/png'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
});
