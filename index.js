import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const backendRootDir = process.env.BOT_MERCEARIA_ROOT || path.resolve(rootDir, "..", "bot-mercearia");
const backendPort = String(process.env.BOT_MERCEARIA_PORT || process.env.MERCADINHO_BACKEND_PORT || "8787");
const miniAppPort = String(process.env.MINIAPP_PORT || process.env.MERCADINHO_MINIAPP_PORT || "5173");
const backendUrl = `http://127.0.0.1:${backendPort}`;
const miniAppUrl = `http://127.0.0.1:${miniAppPort}`;
const viteCli = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const processes = [];

if (!fs.existsSync(path.join(backendRootDir, "server.js"))) {
  console.error(`Painel oficial nao encontrado em ${backendRootDir}`);
  process.exit(1);
}

const backendProbe = await probeUrl(`${backendUrl}/api/miniapp/catalogo`);
const miniAppProbe = await probeUrl(`${miniAppUrl}/`);
const backendAlreadyRunning = isOfficialBackend(backendProbe);
const miniAppAlreadyRunning = isMiniAppShell(miniAppProbe);

if (backendProbe.reachable && !backendAlreadyRunning) {
  console.error(`Porta ${backendPort} esta ocupada por outro processo. Feche esse processo antes de iniciar o painel oficial.`);
  process.exit(1);
}

if (miniAppProbe.reachable && !miniAppAlreadyRunning) {
  console.error(`Porta ${miniAppPort} esta ocupada por outro processo. Feche esse processo ou defina MINIAPP_PORT.`);
  process.exit(1);
}

function startProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || rootDir,
    env: { ...process.env, ...(options.env || {}) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  processes.push(child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      process.exitCode = code;
      shutdown();
    }
  });
}

function shutdown() {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

console.log("Abrindo Mercadinho local:");

if (backendAlreadyRunning) {
  console.log(`Painel oficial ja esta rodando: ${backendUrl}/admin`);
} else {
  startProcess("painel-oficial", process.execPath, ["server.js"], {
    cwd: backendRootDir,
    env: officialBackendEnv(),
  });
  console.log(`Painel oficial: ${backendUrl}/admin`);
}

if (miniAppAlreadyRunning) {
  console.log(`Mini App ja esta rodando: ${miniAppUrl}`);
} else {
  startProcess(
    "miniapp",
    process.execPath,
    [viteCli, "--host", "127.0.0.1", "--port", miniAppPort, "--strictPort"],
    {
      env: {
        VITE_PANEL_URL: `${backendUrl}/admin`,
        VITE_API_PROXY_TARGET: backendUrl,
      },
    },
  );
  console.log(`Mini App: ${miniAppUrl}`);
}

if (processes.length === 0) {
  console.log("Nada novo foi iniciado porque tudo ja esta rodando.");
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      reachable: true,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      location: response.headers.get("location") || "",
      text,
    };
  } catch {
    return { reachable: false };
  } finally {
    clearTimeout(timeout);
  }
}

function isOfficialBackend(probe) {
  if (!probe.reachable) return false;
  return probe.status === 200 && probe.contentType.includes("application/json") && probe.text.includes("produtos");
}

function isMiniAppShell(probe) {
  if (!probe.reachable) return false;
  return probe.status === 200 && probe.contentType.includes("text/html") && probe.text.includes("Mercadinho Telegram");
}

function officialBackendEnv() {
  return {
    PORT: backendPort,
    GITHUB_AUTO_SYNC_ON_START: "0",
    AUTO_PUBLICAR_LOJINHA_GIT: "0",
    DISABLE_LOJINHA_PAGES_SYNC: "1",
    DISABLE_TELEGRAM_POLLING: "1",
    DISABLE_TELEGRAM_WORKER: "1",
    DISABLE_TELEGRAM_COMMANDS_SYNC: "1",
    TELEGRAM_COMMANDS_SYNC_ON_STARTUP: "0",
    PAINEL_ACESSO_LIVRE: "1",
  };
}
