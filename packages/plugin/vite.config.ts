/**
 * Vite config for Figma plugin sandbox code (code.js)
 * Must output a single IIFE bundle.
 */

import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/plugin/controller.ts"),
      name: "DesignForgePlugin",
      formats: ["iife"],
      fileName: () => "code.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "code.js",
        extend: true,
      },
    },
    minify: "esbuild",
    sourcemap: false,
    target: "es2022",
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
