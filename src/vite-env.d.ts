/// <reference types="vite/client" />

/** Version aus package.json + '+' + Kurzhash, beim Build eingesetzt */
declare const __APP_VERSION__: string;
/** voller Commit-Hash oder «unbekannt», beim Build eingesetzt */
declare const __APP_COMMIT__: string;
