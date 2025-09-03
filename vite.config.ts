/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

export default defineConfig({
  server: { middlewareMode: true },
  appType: "custom",
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          globSync("pages/**/*.client.ts").map((file) => [
            // This removes `src/` as well as the file extension from each
            // file, so e.g. src/nested/foo.js becomes nested/foo
            path.relative(
              "src",
              file.slice(0, file.length - path.extname(file).length),
            ),
            // This expands the relative paths to absolute paths, so e.g.
            // src/nested/foo becomes /project/src/nested/foo.js
            fileURLToPath(new URL(file, import.meta.url)),
          ]),
        ),
      },
    },
  },
  optimizeDeps: {
    exclude: ["lit", "lit-html"],
  },
  test: {
    projects: [
        {
            test: {
                include: ['src/**/*.test.ts'],
                exclude: ['node_modules', 'dist', 'src/components', 'src/**/*.client.test.ts'],
                globals: true,
                environment: 'node',
            }
        },
        {
            test: {
                include: [
                    'src/components/**/*.test.ts',
                    'src/**/*.client.test.ts'
                ],
                name: 'browser',
                browser: {
                    enabled: true,
                    provider: 'playwright',
                    instances: [
                        { browser: 'chromium', headless: true },
                    ],
                },
            }
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
  }
})