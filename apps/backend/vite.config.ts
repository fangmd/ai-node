import { defineConfig } from "vite";
import devServer from "@hono/vite-dev-server";
import nodeAdapter from "@hono/vite-dev-server/node";

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
  plugins: [
    devServer({
      entry: "src/index.ts",
      adapter: nodeAdapter,
    }),
  ],
  // Vite runs before app entry; minimal env read for dev server port only.
  server: {
    port: Number(process.env.PORT) || 3000,
  },
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
