import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// Build-time version injection
function getBuildMeta() {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  let gitSha = "local";
  try {
    gitSha = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // Not a git repo or git not available — use "local"
  }
  return {
    version: pkg.version as string,
    sha: gitSha,
    time: new Date().toISOString(),
  };
}

const buildMeta = getBuildMeta();

// Also expose as VITE_APP_VERSION for standard Vite env access
process.env.VITE_APP_VERSION = `${buildMeta.version}+${buildMeta.sha}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __APP_BUILD_SHA__: JSON.stringify(buildMeta.sha),
    __APP_BUILD_TIME__: JSON.stringify(buildMeta.time),
  },
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/bundle-analysis.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router"],
          "query-vendor": ["@tanstack/react-query"],
          "ui-vendor": ["sonner", "lucide-react"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
  },
});
