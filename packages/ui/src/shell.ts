import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { workspaceRootSync } from 'workspace-root';

const isProd = process.env.NODE_ENV === 'production';
const workspaceRoot = workspaceRootSync()!;

// ---------------------------------------------------------------------------
// Vite manifest (production only)
// ---------------------------------------------------------------------------
// In production the client build writes dist/client/.vite/manifest.json which
// maps source paths (relative to the workspace root) to hashed output files.
//
// Manifest keys are the *resolved* source paths. With pnpm these go through
// the .pnpm store (e.g. node_modules/.pnpm/@pkg+name@1.0.0/node_modules/...)
// which differ from the logical symlinked paths. We therefore build secondary
// indices by rollup input name and by the trailing logical path so lookups
// work regardless of the package manager's link strategy.

interface ManifestChunk {
  file: string;
  name?: string;
  src?: string;
  css?: string[];
  imports?: string[];
}

type Manifest = Record<string, ManifestChunk>;

let manifest: Manifest | null = null;
/** Lookup by rollup input name (e.g. "fontsource-inconsolata") */
let manifestByName: Map<string, ManifestChunk> | null = null;
/** Lookup by logical path tail (e.g. "@fontsource/inconsolata/index.css") */
let manifestByTail: Map<string, ManifestChunk> | null = null;

if (isProd) {
  const manifestPath = resolve(workspaceRoot, 'dist/client/.vite/manifest.json');
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
  } catch (err) {
    throw new Error(`Vite manifest not found at ${manifestPath}. Was the client build step run?`, {
      cause: err,
    });
  }

  manifestByName = new Map();
  manifestByTail = new Map();
  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk.name) manifestByName.set(chunk.name, chunk);
    // For pnpm resolved paths like
    // node_modules/.pnpm/@pkg+name@ver/node_modules/@scope/pkg/file.css
    // extract the tail after the last node_modules/ segment.
    const lastNm = key.lastIndexOf('node_modules/');
    if (lastNm !== -1) {
      const tail = key.slice(lastNm + 'node_modules/'.length);
      manifestByTail.set(tail, chunk);
    }
  }
}

/**
 * Look up an entry in the Vite manifest by its rollup input name.
 * Used for the well-known shell assets (CSS, hydrate support, webawesome-init).
 */
function manifestByInputName(name: string): string {
  const chunk = manifestByName?.get(name);
  if (chunk) return `/${chunk.file}`;
  console.warn(`[shell] manifest entry not found for input name: ${name}`);
  return name;
}

/**
 * Look up an entry by source path. Tries exact key first, then falls back
 * to the tail-match index for pnpm-resolved paths.
 */
function manifestAsset(srcKey: string): string {
  if (manifest) {
    const key = srcKey.startsWith('/') ? srcKey.slice(1) : srcKey;
    // Direct key match (works for project-local files like pages/*.client.ts)
    const chunk = manifest[key];
    if (chunk) return `/${chunk.file}`;
    // Tail match (handles pnpm .pnpm/ store paths for node_modules deps)
    if (key.startsWith('node_modules/')) {
      const tail = key.slice('node_modules/'.length);
      const tailChunk = manifestByTail?.get(tail);
      if (tailChunk) return `/${tailChunk.file}`;
    }
    console.warn(`[shell] manifest entry not found for: ${srcKey}`);
  }
  return srcKey;
}

/**
 * Collect CSS files for a manifest entry, recursively traversing all
 * transitive imports so deeply nested CSS is never missed.
 */
function manifestCss(srcKey: string): string[] {
  if (!manifest) return [];
  const key = srcKey.startsWith('/') ? srcKey.slice(1) : srcKey;
  const cssFiles: string[] = [];
  const visited = new Set<string>();

  function collect(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const chunk = manifest![k];
    if (!chunk) return;
    if (chunk.css) cssFiles.push(...chunk.css.map((c) => `/${c}`));
    if (chunk.imports) chunk.imports.forEach(collect);
  }

  collect(key);
  return cssFiles;
}

// ---------------------------------------------------------------------------
// Dev helpers
// ---------------------------------------------------------------------------

function resolveModulePath(module: string) {
  return import.meta.resolve(module).replace(`file://${workspaceRoot}`, '');
}

// ---------------------------------------------------------------------------
// Pre-compute static asset paths — these don't change per-request.
// In production, look up by the rollup input name defined in vite.config.ts.
// ---------------------------------------------------------------------------

const inconsolataCss = isProd
  ? manifestByInputName('fontsource-inconsolata')
  : resolveModulePath('@fontsource/inconsolata/index.css');
const webawesomeCss = isProd
  ? manifestByInputName('webawesome-styles')
  : resolveModulePath('@awesome.me/webawesome/dist/styles/webawesome.css');
const webawesomeThemeCss = isProd
  ? manifestByInputName('webawesome-theme')
  : resolveModulePath('@awesome.me/webawesome/dist/styles/themes/awesome.css');

const hydrateSupportJs = isProd
  ? manifestByInputName('lit-hydrate-support')
  : resolveModulePath('@lit-labs/ssr-client/lit-element-hydrate-support.js');

const webawesomeInitJs = isProd ? manifestByInputName('webawesome-init') : null;

export function render(pageDirectory: string, pageContent: unknown) {
  const clientEntrySrc = `packages/ui/src/pages/${pageDirectory}/${pageDirectory}.client.ts`;
  const clientEntryPath = isProd
    ? manifestAsset(clientEntrySrc)
    : `/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.client.ts`;

  // In production, collect additional CSS emitted by the page's client bundle
  const pageExtraCss = isProd ? manifestCss(clientEntrySrc) : [];
  const allExtraCss = [...new Set(pageExtraCss)];

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
