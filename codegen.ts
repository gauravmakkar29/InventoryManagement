import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "src/lib/schema/schema.graphql",
  generates: {
    "src/lib/schema/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        // Use TypeScript enums matching the existing enums in src/lib/types.ts
        enumsAsTypes: true,
        // Avoid __typename clutter in generated types
        skipTypename: true,
        // Use 'interface' for object types for consistency with project style
        declarationKind: "interface",
        // Scalars mapping
        scalars: {
          ID: "string",
        },
      },
    },
  },
};

export default config;
