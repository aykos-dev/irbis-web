import { defineConfig } from "orval";

const input = { target: "../irbis-api/openapi.json" };

export default defineConfig({
  irbis: {
    input,
    output: {
      mode: "tags-split",
      target: "src/shared/api/generated/endpoints",
      schemas: "src/shared/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: { path: "src/shared/api/client.ts", name: "apiClient" },
      },
    },
  },
  irbisZod: {
    input,
    output: {
      mode: "tags-split",
      target: "src/shared/api/generated/endpoints",
      client: "zod",
      fileExtension: ".zod.ts",
    },
  },
});
