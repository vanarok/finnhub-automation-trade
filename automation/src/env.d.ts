/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TOKEN_API: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
