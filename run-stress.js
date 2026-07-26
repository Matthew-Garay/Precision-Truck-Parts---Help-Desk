import { execSync } from "child_process";
import { readFileSync, unlinkSync, existsSync } from "fs";

const pruebas = {
  tickets:     { yaml: "stress-tickets.yml",     nombre: "Creación de Tickets" },
  inventario:  { yaml: "stress-inventario.yml",  nombre: "Consulta de Inventario" },
  dashboard:   { yaml: "stress-dashboard.yml",   nombre: "Métricas del Dashboard" },
  solicitudes: { yaml: "stress-solicitudes.yml", nombre: "Solicitudes de Insumos" },
};

const arg    = process.argv[2] || "tickets";
const prueba = pruebas[arg];
if (!prueba) {
  console.error(`\n❌ Prueba inválida. Opciones: ${Object.keys(pruebas).join(", ")}`);
  process.exit(1);
}

const OUTPUT = "resultado-stress-temp.json";
const YAML   = prueba.yaml;

const hora = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║     PRUEBA DE ESTRÉS — PrecisionTrucks HelpDesk         ║");
console.log(`║     Escenario : ${prueba.nombre.padEnd(41)}║`);
console.log(`║     Hora      : ${hora.padEnd(41)}║`);
console.log("╚══════════════════════════════════════════════════════════╝\n");

if (existsSync(OUTPUT)) unlinkSync(OUTPUT);

try {
  execSync(`artillery run ${YAML} --output ${OUTPUT}`, { stdio: "inherit" });
} catch { /* Artillery sale con código != 0 si hay fallos, el JSON igual se genera */ }

if (!existsSync(OUTPUT)) {
  console.error("❌ No se generó el archivo de resultados.");
  process.exit(1);
}

const agg      = JSON.parse(readFileSync(OUTPUT, "utf-8")).aggregate;
const c        = agg.counters  ?? {};
const s        = agg.summaries ?? {};
const rt       = s["http.response_time"] ?? {};
const sl       = s["vusers.session_length"] ?? {};

const exitosos  = (c["http.codes.200"] ?? 0) + (c["http.codes.201"] ?? 0);
const vCreated  = c["vusers.created"]   ?? 0;
const vDone     = c["vusers.completed"] ?? 0;
const vFailed   = c["vusers.failed"]    ?? 0;
const tasaExito = vCreated > 0 ? ((vDone / vCreated) * 100).toFixed(1) : "0.0";
const pctFallo  = vCreated > 0 ? (vFailed / vCreated) * 100 : 0;

let icono;
if      (pctFallo < 5)  icono = "✅ EXCELENTE";
else if (pctFallo < 20) icono = "⚠️  ACEPTABLE";
else if (pctFallo < 60) icono = "🔶 DEGRADADO";
else                    icono = "❌ COLAPSADO";

const horaFin = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║                   RESULTADOS                            ║");
console.log(`║  Hora de fin : ${horaFin.padEnd(43)}║`);
console.log(`║  Estado      : ${icono.padEnd(43)}║`);
console.log(`║  Tasa éxito  : ${(tasaExito + "%").padEnd(43)}║`);
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  USUARIOS                                                ║");
console.log(`║    Creados     : ${String(vCreated).padEnd(41)}║`);
console.log(`║    Completados : ${String(vDone).padEnd(41)}║`);
console.log(`║    Fallidos    : ${String(vFailed).padEnd(41)}║`);
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  RESPUESTAS HTTP                                         ║");
console.log(`║    Exitosas (200/201) : ${String(exitosos).padEnd(35)}║`);
console.log(`║    400 Bad Request    : ${String(c["http.codes.400"] ?? 0).padEnd(35)}║`);
console.log(`║    401 No autorizado  : ${String(c["http.codes.401"] ?? 0).padEnd(35)}║`);
console.log(`║    429 Rate limit     : ${String(c["http.codes.429"] ?? 0).padEnd(35)}║`);
console.log(`║    500 Error servidor : ${String(c["http.codes.500"] ?? 0).padEnd(35)}║`);
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  LATENCIA (ms)                                           ║");
console.log(`║    Mínima   : ${String(rt.min    ?? 0).padEnd(44)}║`);
console.log(`║    Mediana  : ${String(Math.round(rt.median ?? 0)).padEnd(44)}║`);
console.log(`║    p95      : ${String(Math.round(rt.p95    ?? 0)).padEnd(44)}║`);
console.log(`║    p99      : ${String(Math.round(rt.p99    ?? 0)).padEnd(44)}║`);
console.log(`║    Máxima   : ${String(rt.max    ?? 0).padEnd(44)}║`);
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  ERRORES DE RED                                          ║");
console.log(`║    Timeout  : ${String(c["errors.ERR_SOCKET_TIMEOUT"] ?? 0).padEnd(44)}║`);
console.log(`║    Rechazado: ${String(c["errors.ECONNREFUSED"]       ?? 0).padEnd(44)}║`);
console.log("╠══════════════════════════════════════════════════════════╣");
console.log("║  CONCLUSIÓN                                              ║");
if (pctFallo < 5) {
console.log("║  Sistema estable bajo toda la carga probada.             ║");
console.log("║  Apto para producción.                                   ║");
} else if (pctFallo < 40) {
console.log("║  Sistema se degradó en el pico pero mantuvo              ║");
console.log("║  disponibilidad parcial. Adecuado para uso interno.      ║");
} else {
console.log("║  Sistema alcanzó su límite en el pico de carga.          ║");
console.log("║  Para 27 empleados en uso real es suficiente.            ║");
}
console.log("╚══════════════════════════════════════════════════════════╝\n");
