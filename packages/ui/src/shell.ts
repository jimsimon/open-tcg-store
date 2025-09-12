import { html } from "lit";
import { workspaceRootSync } from "workspace-root";

const workspaceRoot = workspaceRootSync()!;

export function render(pageDirectory: string, pageContent: unknown) {
  return `
    <!doctype html>
    <html lang="en" class="wa-theme-default wa-palette-default wa-brand-blue">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TCG Store</title>
        <style>
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
        <link rel="stylesheet" href="${resolveModulePath("@fontsource/inconsolata/index.css")}"/>
        <link
          rel="stylesheet"
          href="${resolveModulePath("@awesome.me/webawesome/dist/styles/webawesome.css")}"
        />
        <link rel="stylesheet" href="${resolveModulePath("@awesome.me/webawesome/dist/styles/themes/awesome.css")}" />
        <script type="module" src="/@vite/client"></script>
      </head>
      <body>
        ${pageContent}
        <script
          type="module"
          src="${resolveModulePath("@lit-labs/ssr-client/lit-element-hydrate-support.js")}"
        ></script>
        <script type="module">
          import { setBasePath } from '${resolveModulePath("@awesome.me/webawesome")}';
          setBasePath('${resolveModulePath("@awesome.me/webawesome")}');
        </script>
        <script
          type="module"
          src="/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.client.ts"
        ></script>
      </body>
    </html>
  `;
}

function resolveModulePath(module: string) {
  return import.meta.resolve(module).replace(`file://${workspaceRoot}`, "");
}
