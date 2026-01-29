import { defineConfig } from "vite";

const nodeBuiltins = [
  "node:http",
  "node:https",
  "node:stream",
  "node:url",
  "node:path",
  "node:fs",
  "node:os",
  "node:crypto",
  "node:util",
  "http",
  "https",
  "stream",
  "url",
  "path",
  "fs",
  "os",
  "crypto",
  "util",
  "http2",
];

export default defineConfig({
  build: {
    ssr: "src/index.ts",
    outDir: "dist",
    rollupOptions: {
      input: "src/index.ts",
      output: { entryFileNames: "index.js" },
      external: (id) =>
        nodeBuiltins.some((m) => id === m || id.startsWith(`${m}/`)) ||
        id.startsWith("node:"),
    },
  },
});
