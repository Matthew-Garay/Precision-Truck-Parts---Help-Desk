// Check backend syntax for the current project.
// Usage: node check-backend-syntax.mjs <project-root>
// Example: node check-backend-syntax.mjs "D:\Proyecto de Residencias-Matthew Garay\PrecisionTrucks_HelpDesk"
// Usa el parser real de Node (node --check) en lugar de regex, para que
// imports multilínea y funciones async no generen falsos positivos.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.argv[2] ?? process.cwd();
if (!root || !fs.existsSync(root)) {
  console.error("Error: proyecto no encontrado:", root);
  process.exit(1);
}

const backendDir = path.join(root, "src/Backend");
if (!fs.existsSync(backendDir)) {
  console.error("Error: no existe", backendDir);
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
})(backendDir);

let ok = true;
for (const file of files) {
  const res = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (res.status === 0) {
    console.log(`OK: ${file}`);
  } else {
    console.error(`ERROR: ${file}\n${(res.stderr || res.stdout || "").trim()}`);
    ok = false;
  }
}

console.log(`\n${files.length} archivos revisados.`);
process.exit(ok ? 0 : 1);