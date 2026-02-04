/// <reference types="vite/client" />

declare module 'json-bigint';

interface ImportMetaEnv {
  // add Vite env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
