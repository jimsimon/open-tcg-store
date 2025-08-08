import { html } from "lit";

import "./shell.client.ts";

export function render(pageDirectory: string, pageContent: unknown) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TCG Store</title>
        <style>
          body {
            margin: 0;
            background-color: var(--md-sys-color-surface-variant);
            font-family: "Lato";
          }
        </style>
        <link
          rel="stylesheet"
          media="(prefers-color-scheme:light)"
          href="/src/themes/light.css"
          onload="document.documentElement.classList.add('light');"
        />
        <link
          rel="stylesheet"
          media="(prefers-color-scheme:dark)"
          href="/src/themes/dark.css"
          onload="document.documentElement.classList.add('dark');"
        />
        <script type="module" src="/@vite/client"></script>
      </head>
      <body>
        ${pageContent}
        <script
          type="module"
          src="/node_modules/@lit-labs/ssr-client/${process.env.NODE_ENV ===
          "development"
            ? "development/"
            : ""}lit-element-hydrate-support.js"
        ></script>
        <script type="module" src="/src/shell.client.ts"></script>
        <script
          type="module"
          src="/src/pages/${pageDirectory}/index.client.ts"
        ></script>
      </body>
    </html>
  `;
}
