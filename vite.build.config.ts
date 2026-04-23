import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const uiSrcDir = resolve('packages/ui/src');
const pagesDir = join(uiSrcDir, 'pages');

// Auto-discover all page client entry points
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

export default defineConfig({
  root: resolve('.'),
  resolve: {
    conditions: ['browser'],
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
        'lit-hydrate-support': resolve(
          'node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js',
        ),
        // Web Awesome base path initializer (setBasePath)
        'webawesome-init': resolve('packages/ui/src/webawesome-init.ts'),
      },
    },
    // Ensure CSS is extracted into separate files
    cssCodeSplit: true,
  },
});
