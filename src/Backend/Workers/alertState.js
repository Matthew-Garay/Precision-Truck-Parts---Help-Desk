/**
 * alertState.js
 *
 * Persiste los Sets de deduplicación de alertas en un archivo JSON local
 * para que sobrevivan reinicios del servidor.
 *
 * Estructura del archivo:
 * {
 *   "slaAlertados":        [1, 4, 7],
 *   "sinAtenderAlertados": [2, 5],
 *   "stockAlertados":      [3, 9]
 * }
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE  = path.join(__dirname, "alert_state.json");

const KEYS = ["slaAlertados", "sinAtenderAlertados", "stockAlertados"];

// ── Cargar estado desde disco al arrancar ─────────────────────────
function cargarEstado() {
  try {
    const raw  = fs.readFileSync(STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      slaAlertados:        new Set(Array.isArray(data.slaAlertados)        ? data.slaAlertados        : []),
      sinAtenderAlertados: new Set(Array.isArray(data.sinAtenderAlertados) ? data.sinAtenderAlertados : []),
      stockAlertados:      new Set(Array.isArray(data.stockAlertados)      ? data.stockAlertados      : []),
    };
  } catch {
    // Archivo inexistente o corrupto → estado limpio
    return {
      slaAlertados:        new Set(),
      sinAtenderAlertados: new Set(),
      stockAlertados:      new Set(),
    };
  }
}

// ── Guardar estado actual a disco ─────────────────────────────────
// writeFileSync con escritura atómica vía archivo temporal para evitar
// corrupción si el proceso muere justo durante la escritura.
function guardarEstado(sets) {
  const data = JSON.stringify({
    slaAlertados:        [...sets.slaAlertados],
    sinAtenderAlertados: [...sets.sinAtenderAlertados],
    stockAlertados:      [...sets.stockAlertados],
  });

  const tmp = STATE_FILE + ".tmp";
  try {
    fs.writeFileSync(tmp, data, "utf8");
    fs.renameSync(tmp, STATE_FILE);   // atómico en todos los SO modernos
  } catch (err) {
    console.error("[alertState] Error al guardar estado:", err.message);
    try { fs.unlinkSync(tmp); } catch { /* tmp puede no existir */ }
  }
}

// ── Proxy que persiste automáticamente tras cada mutación ─────────
// Devuelve un objeto donde cada Set tiene métodos add/delete/clear
// que llaman a guardarEstado() después de la mutación.
export function crearSetsPresistentes() {
  const sets = cargarEstado();

  const wrap = (key) => ({
    get size() { return sets[key].size; },
    has:    (v) => sets[key].has(v),
    [Symbol.iterator]: () => sets[key][Symbol.iterator](),

    add(v) {
      if (!sets[key].has(v)) {
        sets[key].add(v);
        guardarEstado(sets);
      }
      return this;
    },

    delete(v) {
      const removed = sets[key].delete(v);
      if (removed) guardarEstado(sets);
      return removed;
    },

    clear() {
      if (sets[key].size > 0) {
        sets[key].clear();
        guardarEstado(sets);
      }
    },
  });

  return {
    slaAlertados:        wrap("slaAlertados"),
    sinAtenderAlertados: wrap("sinAtenderAlertados"),
    stockAlertados:      wrap("stockAlertados"),
  };
}
