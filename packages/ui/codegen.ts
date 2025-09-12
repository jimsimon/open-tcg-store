import type { CodegenConfig } from "@graphql-codegen/cli";
import { defineConfig } from "@eddeee888/gcg-typescript-resolver-files";

const config: CodegenConfig = {
  schema: ["../api/src/schema/**/schema.graphql"],
  documents: ["./src/*.ts", "./src/**/*.ts"],
  generates: {
    "../api/src/schema": defineConfig({ tsConfigFilePath: "../../tsconfig.json" }),
    "./src/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
      },
    },
  },
};

export default config;
