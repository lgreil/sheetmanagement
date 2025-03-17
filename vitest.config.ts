// vitest.config.ts
import { defineVitestConfig } from "@nuxt/test-utils/config";
import { fileURLToPath, URL } from "node:url";

export default defineVitestConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "#app": fileURLToPath(new URL("./.nuxt/app", import.meta.url)),
      "~": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
