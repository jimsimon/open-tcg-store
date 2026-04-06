import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 120,
  singleQuote: true,
  ignorePatterns: ['*.generated.*', 'packages/ui/src/graphql/fragment-masking.ts', 'packages/ui/src/graphql/index.ts'],
});
