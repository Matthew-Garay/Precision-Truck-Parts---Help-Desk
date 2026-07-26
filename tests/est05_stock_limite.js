/**
 * PT-EST-05 — Aprobación de solicitud con stock al límite
 *
 * Verifica que el mecanismo FOR UPDATE de Insumo.descontarStock()
 * impide que el stock quede negativo cuando dos aprobaciones llegan
 * casi al mismo tiempo sobre el mismo insumo con stock = 1.
 *
 * Pasos que ejecuta este script:
 *   1. Fija el stock del insumo a 1 (vía SQL directo usando las credenciales del .env)
 *   2. Crea DOS solicitudes de 1 unidad del mismo insumo
 *   3. Intenta aprobar AMBAS solicitudes en paralelo (Promise.all)
 *   4. Verifica que el stock final es 0 (nunca negativo)
 *   5. Verifica que exactamente UNA aprobación fue exitosa y la otra fue rechazada
 *
 * Uso:
 *   1. npm run dev:all   (servidor corriendo en :3001)
 *   2. node tests/est05_stock_limite.js <TOKEN_ADMIN> <TOKEN_USUARIO> <ID_EMPLEADO_USUARIO> <ID_INSUMO>
 *
 * Ejemplo:
 *   node tests/est05_stock_limite.js eyAdmin... eyUsuario... 2 1
 */

import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const [TOKEN_ADMIN, TOKEN_USUARIO, ID_EMPLEADO, ID_INSUMO] = process.argv.slice(2);

if (!TOKEN_ADMIN || !TOKEN_USUARIO || !ID_EMPLEADO || !ID_INSUMO) {
  console.error("❌  Uso: node tests/est05_stock_limite.js <TOKEN_ADMIN> <TOKEN_USUARIO> <ID_EMPLEADO> <ID_INSUMO>");
  process.exit(1);
}

// Leer .env manualmente (el script corre fuera del contexto de Express)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const BASE_URL   = "http://192.168.1.167:3001/api";
const id_insumo  = parseInt(ID_INSUMO);
const id_empleado = parseInt(ID_EMPLEADO);

// ── Helpers HTTP ──────────────────────────────────────────────────────────────

async function crearSolicitud(cantidad = 1) {
  const res = await fetch(`${BASE_URL}/solicitudes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN_USUARIO}`,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({
      prioridad:   "Alta",
      id_empleado,
      insumos: [{ id_insumo, cantidad }],
    }),
  });
  return res.json();
}

async function aprobarSolicitud(id_solicitud, id_solicitud_insumo) {
  const inicio = Date.now();
  const res = await fetch(`${BASE_URL}/solicitudes/${id_solicitud}/estatus`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN_ADMIN}`,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({
      estatus: "Aceptado",
      items: [{ id_solicitud_insumo, aprobado: 1, cantidad_aprobada: 1 }],
    }),
  });
  const data = await res.json();
  return { status: res.status, data, ms: Date.now() - inicio };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔥  PT-EST-05 — Aprobación simultánea con stock al límite`);
  console.log(`    Insumo ID: ${id_insumo}  |  Empleado ID: ${id_empleado}\n`);

  // Conectar a MySQL para leer/escribir stock directamente
  const pool = await mysql.createPool({
    host:     env.DB_HOST     || "localhost",
    port:     parseInt(env.DB_PORT || "3306"),
    user:     env.DB_USER     || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME     || "precision_helpdesk",
    connectionLimit: 5,
  });

  // 1. Verificar que el insumo existe
  const [[insumo]] = await pool.query(
    "SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = ? LIMIT 1",
    [id_insumo]
  );
  if (!insumo) {
    console.error(`❌  El insumo con id ${id_insumo} no existe en la BD`);
    await pool.end(); process.exit(1);
  }

  const stockOriginal = insumo.stock;
  console.log(`  Insumo encontrado : "${insumo.nombre}"`);
  console.log(`  Stock original    : ${stockOriginal}`);

  // 2. Fijar stock = 1
  await pool.query("UPDATE insumo SET stock = 1 WHERE id_insumo = ?", [id_insumo]);
  console.log("  Stock fijado a    : 1\n");

  // 3. Crear DOS solicitudes de 1 unidad (stock = 1, así solo una puede aprobarse)
  console.log("  Creando solicitud A...");
  const solA = await crearSolicitud(1);
  if (!solA.ok) {
    console.error("  ❌  No se pudo crear solicitud A:", solA.error);
    await pool.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stockOriginal, id_insumo]);
    await pool.end(); process.exit(1);
  }
  console.log(`  ✅  Solicitud A: ${solA.folio_solicitud} (id: ${solA.id_solicitud})`);

  // Para crear la solicitud B necesitamos volver a poner stock = 1
  // porque la creación de solicitud valida stock disponible
  await pool.query("UPDATE insumo SET stock = 1 WHERE id_insumo = ?", [id_insumo]);

  console.log("  Creando solicitud B...");
  const solB = await crearSolicitud(1);
  if (!solB.ok) {
    console.error("  ❌  No se pudo crear solicitud B:", solB.error);
    await pool.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stockOriginal, id_insumo]);
    await pool.end(); process.exit(1);
  }
  console.log(`  ✅  Solicitud B: ${solB.folio_solicitud} (id: ${solB.id_solicitud})\n`);

  // Obtener los id_solicitud_insumo de cada solicitud
  const [[itemA]] = await pool.query(
    "SELECT id_solicitud_insumo FROM solicitud_insumo WHERE id_solicitud = ? AND id_insumo = ? LIMIT 1",
    [solA.id_solicitud, id_insumo]
  );
  const [[itemB]] = await pool.query(
    "SELECT id_solicitud_insumo FROM solicitud_insumo WHERE id_solicitud = ? AND id_insumo = ? LIMIT 1",
    [solB.id_solicitud, id_insumo]
  );

  // 4. Aprobar AMBAS en paralelo (race condition intencional)
  console.log("  Aprobando A y B en paralelo (Promise.all)...");
  const [resA, resB] = await Promise.all([
    aprobarSolicitud(solA.id_solicitud, itemA.id_solicitud_insumo),
    aprobarSolicitud(solB.id_solicitud, itemB.id_solicitud_insumo),
  ]);

  console.log(`\n  Solicitud A → HTTP ${resA.status} en ${resA.ms}ms  |  ${JSON.stringify(resA.data)}`);
  console.log(`  Solicitud B → HTTP ${resB.status} en ${resB.ms}ms  |  ${JSON.stringify(resB.data)}`);

  // 5. Verificar stock final en BD
  const [[stockFinal]] = await pool.query(
    "SELECT stock FROM insumo WHERE id_insumo = ?", [id_insumo]
  );

  console.log(`\n  Stock final en BD : ${stockFinal.stock}`);

  const exitosas  = [resA, resB].filter(r => r.status === 200).length;
  const rechazadas = [resA, resB].filter(r => r.status !== 200).length;

  console.log(`  Aprobaciones OK   : ${exitosas}`);
  console.log(`  Rechazadas/Error  : ${rechazadas}`);

  console.log("\n  ──────────────────────────────────────────");
  if (stockFinal.stock >= 0) {
    console.log("  ✅  INTEGRIDAD: Stock no quedó negativo");
  } else {
    console.log("  ❌  FALLO: Stock quedó negativo — race condition no controlada");
  }

  if (exitosas === 1 && rechazadas === 1) {
    console.log("  ✅  CONCURRENCIA: Solo 1 aprobación exitosa, la otra fue rechazada correctamente");
  } else if (exitosas === 2) {
    console.log("  ❌  FALLO: Ambas aprobaciones pasaron — el stock debería haber bloqueado la segunda");
  } else {
    console.log("  ⚠️   Ambas fallaron — revisar logs del servidor");
  }

  // 6. Restaurar stock original
  await pool.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stockOriginal, id_insumo]);
  console.log(`\n  🔄  Stock restaurado a ${stockOriginal}\n`);

  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error("Error fatal:", err.message); process.exit(1); });
