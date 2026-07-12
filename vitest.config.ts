import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Mesh loads WASM crypto; inline it so Vitest can resolve it in Node.
    server: {
      deps: {
        inline: [/@meshsdk/, /@sidan-lab/],
      },
    },
  },
});
