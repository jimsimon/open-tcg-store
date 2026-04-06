import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 120,
  singleQuote: true,
  ignorePatterns: ['*.generated.*', 'packages/ui/src/graphql/**'],
});
