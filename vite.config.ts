import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const githubPagesBase = "/MiniAppTelegramMercadinho/";
const backendTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? githubPagesBase : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": backendTarget,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
  },
});
