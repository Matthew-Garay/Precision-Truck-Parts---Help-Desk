/**
 * logger.js
 *
 * Registro de errores en archivo. Al importarse, todo `console.error` y
 * `console.warn` del servidor (controladores, workers, errores no manejados)
 * se sigue mostrando en la consola Y además se guarda en:
 *
 *   logs/errores-AAAA-MM-DD.log     (un archivo por día, en la raíz del proyecto)
 *
 * Los archivos de más de DIAS_CONSERVAR días se borran solos al arrancar y una
 * vez al día. Si escribir el log falla (disco lleno, permisos), el servidor
 * sigue funcionando: el log nunca debe tumbar la aplicación.
 *
 * Se importa una sola vez, al inicio de server.js.
 *
 * @module server/utils/logger
 */
import fs   from "fs";
import path from "path";
import util from "util";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOGS_DIR = process.env.LOGS_DIR || path.resolve(__dirname, "../../logs");
const DIAS_CONSERVAR = 30;

const pad = (n) => String(n).padStart(2, "0");
const fechaLocal = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const horaLocal  = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

let dirListo = false;
function asegurarDir() {
  if (dirListo) return true;
  try { fs.mkdirSync(LOGS_DIR, { recursive: true }); dirListo = true; } catch { /* sin log */ }
  return dirListo;
}

/** Escribe una línea en el log del día. Nunca lanza excepción. */
export function escribirLog(nivel, args) {
  if (!asegurarDir()) return;
  try {
    const ahora = new Date();
    const texto = args.map(a => (typeof a === "string" ? a : util.inspect(a, { depth: 4, breakLength: 160 }))).join(" ");
    fs.appendFileSync(path.join(LOGS_DIR, `errores-${fechaLocal(ahora)}.log`),
      `[${fechaLocal(ahora)} ${horaLocal(ahora)}] ${nivel.padEnd(5)} ${texto}\n`, "utf8");
  } catch { /* el log nunca tumba el servidor */ }
}

/** Borra los logs más viejos que DIAS_CONSERVAR días. */
export function limpiarLogsViejos() {
  if (!asegurarDir()) return;
  try {
    const limite = Date.now() - DIAS_CONSERVAR * 86_400_000;
    for (const f of fs.readdirSync(LOGS_DIR)) {
      if (!/^errores-\d{4}-\d{2}-\d{2}\.log$/.test(f)) continue;
      const ruta = path.join(LOGS_DIR, f);
      if (fs.statSync(ruta).mtimeMs < limite) fs.unlinkSync(ruta);
    }
  } catch { /* ignorar */ }
}

// ── Enganche a la consola (solo una vez) ───────────────────────────────
if (!globalThis.__loggerInstalado && process.env.NODE_ENV !== "test") {
  globalThis.__loggerInstalado = true;
  const origError = console.error.bind(console);
  const origWarn  = console.warn.bind(console);
  console.error = (...args) => { origError(...args); escribirLog("ERROR", args); };
  console.warn  = (...args) => { origWarn(...args);  escribirLog("WARN",  args); };
  limpiarLogsViejos();
  setInterval(limpiarLogsViejos, 86_400_000).unref();
}
