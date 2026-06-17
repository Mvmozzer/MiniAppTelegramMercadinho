import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("local runtime contract", () => {
  it("starts the official bot-mercearia backend instead of the reduced local panel server", () => {
    const source = fs.readFileSync("index.js", "utf8");
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

    expect(source).toContain("bot-mercearia");
    expect(source).toContain("server.js");
    expect(source).not.toContain("\"server/index.js\"");
    expect(source).toContain("Painel oficial");
    expect(source).toContain("${backendUrl}/admin");
    expect(packageJson.scripts["dev:full"]).toBe("node index.js");
    expect(packageJson.scripts.server).not.toContain("server/index.js");
  });

  it("keeps the local runner single-instance friendly and disables Telegram polling conflicts", () => {
    const source = fs.readFileSync("index.js", "utf8");

    expect(source).toContain("MINIAPP_PORT");
    expect(source).toContain("--strictPort");
    expect(source).toContain("DISABLE_TELEGRAM_POLLING");
    expect(source).toContain("DISABLE_TELEGRAM_WORKER");
    expect(source).toContain("TELEGRAM_COMMANDS_SYNC_ON_STARTUP");
    expect(source).toContain("PAINEL_ACESSO_LIVRE");
    expect(source).toContain("ja esta rodando");
  });

  it("keeps this repository as the Mini App only, without a parallel admin panel/backend", () => {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(fs.existsSync("server")).toBe(false);
    expect(fs.existsSync("data")).toBe(false);
    expect(fs.existsSync("src/components/AdminPanel.tsx")).toBe(false);
    expect(allDependencies).not.toHaveProperty("express");
    expect(allDependencies).not.toHaveProperty("cors");
    expect(allDependencies).not.toHaveProperty("concurrently");
    expect(allDependencies).not.toHaveProperty("dotenv");
  });
});
