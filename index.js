import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const viteCli = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const processes = [];

function startProcess(label, command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: process.env,
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

startProcess("api", process.execPath, ["server/index.js"]);
startProcess("web", process.execPath, [viteCli, "--host", "127.0.0.1"]);

console.log("Abrindo Mercadinho local:");
console.log("Mini App: http://127.0.0.1:5173");
console.log("Painel:   http://127.0.0.1:5173/painel");
