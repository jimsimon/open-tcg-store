import { html } from "lit";

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
        <link rel="stylesheet" href="/node_modules/@fontsource/inconsolata/index.css"/>
        <link
          rel="stylesheet"
          href="/node_modules/@awesome.me/webawesome/dist/styles/webawesome.css"
        />
        <link rel="stylesheet" href="/node_modules/@awesome.me/webawesome/dist/styles/themes/awesome.css" />
        <script type="module" src="/@vite/client"></script>
      </head>
      <body>
        ${pageContent}
        <script
          type="module"
          src="/node_modules/@lit-labs/ssr-client/${
            process.env.NODE_ENV === "development" ? "development/" : ""
          }lit-element-hydrate-support.js"
        ></script>
        <script type="module">
          import { setBasePath } from '/node_modules/@awesome.me/webawesome';
          setBasePath(import.meta.resolve('/node_modules/@awesome.me/webawesome'));
        </script>
        <script
          type="module"
          src="/src/pages/${pageDirectory}/${pageDirectory}.client.ts"
        ></script>
      </body>
    </html>
  `;
}
