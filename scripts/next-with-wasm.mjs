import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const wasmDir = join(projectRoot, "node_modules", "@next", "swc-wasm-nodejs");
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const [command = "dev", ...args] = process.argv.slice(2);

if (!existsSync(nextBin)) {
  console.error("Next.js is not installed. Run: npm.cmd install");
  process.exit(1);
}

if (!existsSync(wasmDir)) {
  console.error("@next/swc-wasm-nodejs is not installed. Run: npm.cmd install");
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, command, ...args], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NEXT_TEST_WASM_DIR: wasmDir
  },
  stdio: "inherit",
  shell: false
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
