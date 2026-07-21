/**
 * alertState.js
 *
 * Persiste en disco los Sets de deduplicacion de alertas para que
 * sobrevivan reinicios del servidor sin volver a emitir alertas ya enviadas.
 *
 * El estado se guarda en alert_state.json dentro de este mismo directorio.
 * Estructura del archivo JSON:
 * {
 *   "slaAlertados":        [1, 4, 7],
 *   "sinAtenderAlertados": [2, 5],
 *   "stockAlertados":      [3, 9],
 *   "stockEnviadoHoy":     { "5": "2025-06-10" }
 * }
 *
 * stockEnviadoHoy guarda la fecha (YYYY-MM-DD) en que se enviaron las alertas
 * de stock critico a cada admin (por id_empleado). Si la fecha guardada es la
 * de hoy, no se vuelven a emitir hasta el dia siguiente.
 */
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE  = path.join(__dirname, "alert_state.json");

// ── Cargar estado desde disco al arrancar ─────────────────────────
function cargarEstado() {
  try {
    const raw  = fs.readFileSync(STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      slaAlertados:        new Set(Array.isArray(data.slaAlertados)        ? data.slaAlertados        : []),
      sinAtenderAlertados: new Set(Array.isArray(data.sinAtenderAlertados) ? data.sinAtenderAlertados : []),
      stockAlertados:      new Set(Array.isArray(data.stockAlertados)      ? data.stockAlertados      : []),
      stockEnviadoHoy:     (data.stockEnviadoHoy && typeof data.stockEnviadoHoy === "object") ? data.stockEnviadoHoy : {},
    };
  } catch {
    return {
      slaAlertados:        new Set(),
      sinAtenderAlertados: new Set(),
      stockAlertados:      new Set(),
      stockEnviadoHoy:     {},
    };
  }
}

// ── Guardar estado actual a disco ─────────────────────────────────
function guardarEstado(sets) {
  const data = JSON.stringify({
    slaAlertados:        [...sets.slaAlertados],
    sinAtenderAlertados: [...sets.sinAtenderAlertados],
    stockAlertados:      [...sets.stockAlertados],
    stockEnviadoHoy:     sets.stockEnviadoHoy,
  });

  const tmp = STATE_FILE + ".tmp";
  try {
    fs.writeFileSync(tmp, data, "utf8");
    fs.renameSync(tmp, STATE_FILE);
  } catch (err) {
    console.error("[alertState] Error al guardar estado:", err.message);
    try { fs.unlinkSync(tmp); } catch { /* tmp puede no existir */ }
  }
}

// ── Proxy que persiste automáticamente tras cada mutación ─────────
export function crearSetsPersistentes() {
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

  // stockEnviadoHoy: objeto plano { id_empleado: "YYYY-MM-DD" }
  const stockEnviadoHoy = {
    get: (id) => sets.stockEnviadoHoy[String(id)],
    set: (id, fecha) => { sets.stockEnviadoHoy[String(id)] = fecha; guardarEstado(sets); },
  };

  return {
    slaAlertados:        wrap("slaAlertados"),
    sinAtenderAlertados: wrap("sinAtenderAlertados"),
    stockAlertados:      wrap("stockAlertados"),
    stockEnviadoHoy,
  };
}
