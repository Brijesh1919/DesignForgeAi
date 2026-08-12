/**
 * Vite config for Figma plugin UI (index.html)
 * Must inline all CSS/JS into a single HTML file.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: path.resolve(__dirname, "src/ui"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Inline everything
    rollupOptions: {
      input: path.resolve(__dirname, "src/ui/index.html"),
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    target: "es2022",
    minify: "esbuild",
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
