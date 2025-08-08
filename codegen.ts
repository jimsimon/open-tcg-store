import type { CodegenConfig } from "@graphql-codegen/cli";
import { defineConfig } from "@eddeee888/gcg-typescript-resolver-files";

const config: CodegenConfig = {
  schema: ["./src/schema/**/schema.graphql"],
  documents: 'src/**/*.ts',
  generates: {
    "src/schema": defineConfig(),
    "./src/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
      },
    },
    // "./src/graphql/schema.graphql": {
    //   plugins: ["schema-ast"],
    //   config: {
    //     includeDirectives: true,
    //   },
    // },
  },
};

export default config;
