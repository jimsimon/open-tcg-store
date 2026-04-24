import { defineConfig } from 'vitest/config';
import { workspaceRootSync } from 'workspace-root';
import { playwright } from '@vitest/browser-playwright';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Client build entry points (used by `vite build`)
// ---------------------------------------------------------------------------
const uiSrcDir = resolve('packages/ui/src');
const pagesDir = join(uiSrcDir, 'pages');

const pageEntries: Record<string, string> = {};
for (const dir of readdirSync(pagesDir)) {
  const clientFile = join(pagesDir, dir, `${dir}.client.ts`);
  try {
    if (statSync(clientFile).isFile()) {
      pageEntries[`pages/${dir}/${dir}.client`] = clientFile;
    }
  } catch {
    // skip directories without a client entry
  }
}

export default defineConfig(({ command }) => ({
  server: { middlewareMode: true },
  appType: 'custom',
  root: workspaceRootSync() || undefined,
  resolve: {
    // In dev the Vite server needs 'development' to load dev-mode bundles;
    // the production build should only use 'browser'.
    conditions: command === 'serve' ? ['development', 'browser'] : ['browser'],
    externalConditions: command === 'serve' ? ['development', 'browser'] : ['browser'],
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
  build: {
    outDir: 'dist/client',
    manifest: true,
    rollupOptions: {
      input: {
        ...pageEntries,
        // CSS assets referenced by shell.ts
        'fontsource-inconsolata': resolve('node_modules/@fontsource/inconsolata/index.css'),
        'webawesome-styles': resolve('node_modules/@awesome.me/webawesome/dist/styles/webawesome.css'),
        'webawesome-theme': resolve('node_modules/@awesome.me/webawesome/dist/styles/themes/awesome.css'),
        // JS assets referenced by shell.ts
        'lit-hydrate-support': resolve('node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js'),
        // Web Awesome base path initializer (setBasePath)
        'webawesome-init': resolve('packages/ui/src/webawesome-init.ts'),
      },
    },
    cssCodeSplit: true,
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
      {
        test: {
          name: 'scripts',
          root: 'scripts',
          include: ['**/*.test.ts'],
          environment: 'node',
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
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
}));
