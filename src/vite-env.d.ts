/// <reference types="vite/client" />

// Build-time version injection (see vite.config.ts define block)
declare const __APP_VERSION__: string;
declare const __APP_BUILD_SHA__: string;
declare const __APP_BUILD_TIME__: string;
