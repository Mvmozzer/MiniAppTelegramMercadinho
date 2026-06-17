import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const githubPagesBase = "/MiniAppTelegramMercadinho/";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? githubPagesBase : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
  },
});
