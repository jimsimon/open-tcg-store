import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { workspaceRootSync } from 'workspace-root';

const isProd = process.env.NODE_ENV === 'production';
const workspaceRoot = workspaceRootSync()!;

// ---------------------------------------------------------------------------
// Vite manifest (production only)
// ---------------------------------------------------------------------------
// In production the client build writes dist/client/.vite/manifest.json which
// maps source paths (relative to the workspace root) → hashed output files.

interface ManifestChunk {
  file: string;
  css?: string[];
  imports?: string[];
}

type Manifest = Record<string, ManifestChunk>;

let manifest: Manifest | null = null;
if (isProd) {
  const manifestPath = resolve(workspaceRoot, 'dist/client/.vite/manifest.json');
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
}

/**
 * Look up a source file in the Vite manifest and return its hashed build path.
 * Falls back to the dev-mode path if no manifest is loaded.
 */
function manifestAsset(srcKey: string): string {
  if (manifest) {
    const chunk = manifest[srcKey];
    if (chunk) return `/${chunk.file}`;
    // Try without leading slash
    const trimmed = srcKey.startsWith('/') ? srcKey.slice(1) : srcKey;
    const chunk2 = manifest[trimmed];
    if (chunk2) return `/${chunk2.file}`;
    console.warn(`[shell] manifest entry not found for: ${srcKey}`);
  }
  // Dev mode — return the source path as-is (Vite dev server resolves it)
  return srcKey;
}

/**
 * Collect CSS files for a manifest entry (the entry's own CSS + imported chunks' CSS).
 */
function manifestCss(srcKey: string): string[] {
  if (!manifest) return [];
  const key = srcKey.startsWith('/') ? srcKey.slice(1) : srcKey;
  const chunk = manifest[key];
  if (!chunk) return [];

  const cssFiles: string[] = [];
  if (chunk.css) cssFiles.push(...chunk.css.map((c) => `/${c}`));

  // Collect CSS from imported chunks
  if (chunk.imports) {
    for (const imp of chunk.imports) {
      const importedChunk = manifest[imp];
      if (importedChunk?.css) {
        cssFiles.push(...importedChunk.css.map((c) => `/${c}`));
      }
    }
  }
  return cssFiles;
}

// ---------------------------------------------------------------------------
// Dev helpers
// ---------------------------------------------------------------------------

function resolveModulePath(module: string) {
  return import.meta.resolve(module).replace(`file://${workspaceRoot}`, '');
}

// ---------------------------------------------------------------------------
// Pre-compute static asset paths — these don't change per-request
// ---------------------------------------------------------------------------

// CSS assets
const inconsolataCssSrc = 'node_modules/@fontsource/inconsolata/index.css';
const webawesomeCssSrc = 'node_modules/@awesome.me/webawesome/dist/styles/webawesome.css';
const webawesomeThemeCssSrc = 'node_modules/@awesome.me/webawesome/dist/styles/themes/awesome.css';

const inconsolataCss = isProd
  ? manifestAsset(inconsolataCssSrc)
  : resolveModulePath('@fontsource/inconsolata/index.css');
const webawesomeCss = isProd
  ? manifestAsset(webawesomeCssSrc)
  : resolveModulePath('@awesome.me/webawesome/dist/styles/webawesome.css');
const webawesomeThemeCss = isProd
  ? manifestAsset(webawesomeThemeCssSrc)
  : resolveModulePath('@awesome.me/webawesome/dist/styles/themes/awesome.css');

// JS assets
const hydrateSupportSrc = 'node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js';
const hydrateSupportJs = isProd
  ? manifestAsset(hydrateSupportSrc)
  : resolveModulePath('@lit-labs/ssr-client/lit-element-hydrate-support.js');

// Web Awesome base path initializer — bundled in production, inline in dev
const webawesomeInitSrc = 'packages/ui/src/webawesome-init.ts';
const webawesomeInitJs = isProd ? manifestAsset(webawesomeInitSrc) : null;

export function render(pageDirectory: string, pageContent: unknown) {
  const clientEntrySrc = `packages/ui/src/pages/${pageDirectory}/${pageDirectory}.client.ts`;
  const clientEntryPath = isProd
    ? manifestAsset(clientEntrySrc)
    : `/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.client.ts`;

  // In production, collect additional CSS emitted by the page's client bundle
  const pageExtraCss = isProd ? manifestCss(clientEntrySrc) : [];
  const hydrateCss = isProd ? manifestCss(hydrateSupportSrc) : [];
  const allExtraCss = [...new Set([...pageExtraCss, ...hydrateCss])];

  const viteClientTag = isProd ? '' : '<script type="module" src="/@vite/client"></script>';

  // In dev, Vite resolves the bare import; in prod, use the bundled webawesome-init entry
  const webawesomeInitTag = isProd
    ? `<script type="module" src="${webawesomeInitJs}"></script>`
    : `<script type="module">
          import { setBasePath } from '${resolveModulePath('@awesome.me/webawesome')}';
          setBasePath('${resolveModulePath('@awesome.me/webawesome')}');
        </script>`;

  return `
    <!doctype html>
    <html lang="en" class="wa-theme-default wa-palette-default wa-brand-blue">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TCG Store</title>
        <style>
          html, body {
            min-height: 100%;
          }
          body {
            margin: 0;
            box-sizing: border-box;
            background-color: var(--wa-color-surface-lowered);
            color: var(--wa-color-text-normal);
            font-family: "Inconsolata", monospace;
            font-size: var(--wa-font-size-m);
            font-weight: var(--wa-font-weight-body);
            line-height: var(--wa-line-height-normal);
          }
        </style>
        <link rel="stylesheet" href="${inconsolataCss}"/>
        <link rel="stylesheet" href="${webawesomeCss}"/>
        <link rel="stylesheet" href="${webawesomeThemeCss}"/>
        ${allExtraCss.map((css) => `<link rel="stylesheet" href="${css}"/>`).join('\n        ')}
        ${viteClientTag}
      </head>
      <body>
        ${pageContent}
        <script type="module" src="${hydrateSupportJs}"></script>
        ${webawesomeInitTag}
        <script type="module" src="${clientEntryPath}"></script>
      </body>
    </html>
  `;
}
