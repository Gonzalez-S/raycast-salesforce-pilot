import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/org/service.ts",
        "src/org/presentation.ts",
        "src/org/schemas.ts",
        "src/lib/utils.ts",
        "src/project/resolve.ts",
        "src/project/scanner.ts",
      ],
    },
  },
});
