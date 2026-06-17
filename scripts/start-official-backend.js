import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const backendRootDir = process.env.BOT_MERCEARIA_ROOT || path.resolve(rootDir, "..", "bot-mercearia");
const backendPort = String(process.env.BOT_MERCEARIA_PORT || process.env.MERCADINHO_BACKEND_PORT || "8787");

if (!fs.existsSync(path.join(backendRootDir, "server.js"))) {
  console.error(`Painel oficial nao encontrado em ${backendRootDir}`);
  process.exit(1);
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: backendRootDir,
  env: {
    ...process.env,
    PORT: backendPort,
    GITHUB_AUTO_SYNC_ON_START: "0",
    AUTO_PUBLICAR_LOJINHA_GIT: "0",
    DISABLE_LOJINHA_PAGES_SYNC: "1",
    DISABLE_TELEGRAM_POLLING: "1",
    DISABLE_TELEGRAM_WORKER: "1",
    DISABLE_TELEGRAM_COMMANDS_SYNC: "1",
    TELEGRAM_COMMANDS_SYNC_ON_STARTUP: "0",
    PAINEL_ACESSO_LIVRE: "1",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code || 0);
});
