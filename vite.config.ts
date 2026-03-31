import { defineConfig } from 'vitest/config';
import { workspaceRootSync } from 'workspace-root';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  server: { middlewareMode: true },
  appType: 'custom',
  root: workspaceRootSync() || undefined,
  resolve: {
    conditions: ['development', 'browser'],
    externalConditions: ['development', 'browser'],
  },
  ssr: {
    resolve: {
      conditions: ['development', 'browser'],
      externalConditions: ['development', 'browser'],
    },
  },
  optimizeDeps: {
    exclude: ['lit', 'lit-html'],
  },
  test: {
    projects: [
      {
        test: {
          name: 'API',
          root: 'packages/api',
          include: ['src/**/*.test.ts'],
          exclude: ['node_modules', 'dist', 'src/components', 'src/**/*.client.test.ts'],
          globals: true,
          environment: 'node',
        },
      },
      {
        test: {
          name: 'UI',
          root: 'packages/ui',
          include: ['src/components/**/*.test.ts', 'src/**/*.client.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.server.ts',
        'src/**/*.client.ts',
        'src/shell.ts',
        'src/server.ts',
        'src/auth.ts',
        'src/auth-client.ts',
      ],
    },
  },
});
