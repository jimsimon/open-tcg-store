import type { CodegenConfig } from '@graphql-codegen/cli';
import { defineConfig } from '@eddeee888/gcg-typescript-resolver-files';

const config: CodegenConfig = {
  schema: ['packages/api/src/schema/**/schema.graphql'],
  documents: ['packages/ui/src/*.ts', 'packages/ui/src/**/*.ts'],
  generates: {
    'packages/api/src/schema': defineConfig({
      tsConfigFilePath: './tsconfig.json',
      resolverGeneration: 'minimal',
    }),
    'packages/ui/src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
      },
    },
  },
};

export default config;
