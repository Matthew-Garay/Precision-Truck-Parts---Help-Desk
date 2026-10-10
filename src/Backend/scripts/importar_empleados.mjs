/**
 * importar_empleados.mjs  — Carga masiva de empleados desde un CSV.
 *
 * Uso:
 *   node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs <ruta.csv> [--dry-run]
 *
 * Ejemplos:
 *   node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs src/Backend/scripts/plantilla_empleados.csv --dry-run
 *   node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs src/Backend/scripts/plantilla_empleados.csv
 *
 * Columnas del CSV (encabezado obligatorio, en ese orden):
 *   num_empleado, nombre, ap_paterno, ap_materno, email, password, rol, departamento, sucursal
 *
 *   - num_empleado : texto, único, máx 20
 *   - ap_materno   : opcional (déjalo vacío)
 *   - password     : mín 8 caracteres, 1 mayúscula, 1 número, 1 símbolo (ej: Ptp2024*)
 *   - rol          : "Administrador"/"1"  o  "Usuario"/"2"
 *   - departamento : nombre exacto (según catálogo) o su id
 *   - sucursal     : nombre exacto (según catálogo) o su id. Déjalo vacío = sin sucursal
 *   - email        : dominio corporativo (ptp.com.mx, refividrio.com.mx, megapartes.com.mx, ebatruck.com.mx)
 *
 * El script:
 *   - Reutiliza la MISMA validación del backend (dominio de correo + política de contraseña).
 *   - Hashea la contraseña con bcrypt(12) igual que el controlador.
 *   - Inserta con Empleado.crear (estatus "Activo").
 *   - Si una fila falla (duplicado, dato inválido) la reporta y CONTINÚA con las demás.
 *   - Con --dry-run valida todo pero NO inserta nada.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import pool from "../Config/db.js";
import Empleado from "../Models/Empleado.js";
import { validarEmailCorporativo } from "../Middlewares/validate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Parser CSV simple (respeta comillas dobles) ----------
function parseCSV(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  row.push(field);
  rows.push(row);
  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}

// ---------- Validaciones espejo del backend ----------
const norm = (s) => String(s ?? "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quita acentos
const politicaPassword = (p) => {
  if (typeof p !== "string") return "vacía";
  if (p.length < 8) return "mínimo 8 caracteres";
  if (!/[A-Z]/.test(p)) return "falta una mayúscula";
  if (!/[0-9]/.test(p)) return "falta un número";
  if (!/[^A-Za-z0-9]/.test(p)) return "falta un carácter especial";
  return null;
};


async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find(a => !a.startsWith("--"));
  if (!csvPath) {
    console.error("Indica la ruta del CSV. Ej: node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs src/Backend/scripts/plantilla_empleados.csv");
    process.exit(1);
  }
  const abs = path.isAbsolute(csvPath) ? csvPath : path.join(__dirname, csvPath);
  if (!fs.existsSync(abs)) { console.error("No existe el archivo:", abs); process.exit(1); }

  const [roles, departamentos, sucursales] = await Promise.all([
    Empleado.getRoles(),
    Empleado.getDepartamentos(),
    Empleado.getSucursales(),
  ]);

  const resolverRol = (v) => {
    const n = norm(v);
    if (!n) return null;
    if (n === "1" || n.includes("admin")) return 1;
    if (n === "2" || n.includes("usuario")) return 2;
    const r = roles.find(x => norm(x.nombre_rol) === n || String(x.id_rol) === String(v).trim());
    return r ? r.id_rol : null;
  };
  const resolverDepto = (v) => {
    const n = norm(v);
    if (!n) return null;
    const d = departamentos.find(x => norm(x.nombre_departamento) === n || String(x.id_departamento) === String(v).trim());
    return d ? d.id_departamento : null;
  };
  const resolverSucursal = (v) => {
    const n = norm(v);
    if (!n) return null;
    const s = sucursales.find(x => norm(x.nombre_sucursal) === n || String(x.id_sucursal) === String(v).trim());
    return s ? s.id_sucursal : null;
  };

  const rows = parseCSV(fs.readFileSync(abs, "utf8"));
  const header = rows.shift().map(h => h.trim());
  const esperado = ["num_empleado", "nombre", "ap_paterno", "ap_materno", "email", "password", "rol", "departamento", "sucursal"];
  if (header.map(h => h.toLowerCase()).join(",") !== esperado.join(",")) {
    console.error("Encabezado inválido.\n  Esperado:", esperado.join(","), "\n  Recibido:", header.join(","));
    process.exit(1);
  }

  console.log(`Procesando ${rows.length} empleado(s)${dryRun ? "  [DRY-RUN: no se insertará nada]" : ""}...\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    const get = (name) => (c[header.findIndex(h => h.toLowerCase() === name)] ?? "").trim();
    const num_empleado = get("num_empleado");
    const nombre = get("nombre");
    const ap_paterno = get("ap_paterno");
    const ap_materno = get("ap_materno");
    const email = get("email");
    const password = get("password");
    const rolRaw = get("rol");
    const deptoRaw = get("departamento");
    const sucRaw = get("sucursal");
    const n = i + 1;

    const faltan = ["num_empleado", "nombre", "ap_paterno", "email", "password"].filter(f => !get(f));
    if (faltan.length) { console.log(`✗ Fila ${n} (${num_empleado || "?"}): faltan campos: ${faltan.join(", ")}`); fail++; continue; }

    const errEmail = validarEmailCorporativo(email);
    if (errEmail) { console.log(`✗ Fila ${n} (${num_empleado}): ${errEmail}`); fail++; continue; }

    const errPass = politicaPassword(password);
    if (errPass) { console.log(`✗ Fila ${n} (${num_empleado}): contraseña inválida (${errPass})`); fail++; continue; }

    const id_rol = resolverRol(rolRaw);
    if (!id_rol) { console.log(`✗ Fila ${n} (${num_empleado}): rol no reconocido "${rolRaw}" (usa Administrador o Usuario)`); fail++; continue; }

    const id_departamento = resolverDepto(deptoRaw);
    if (!id_departamento) { console.log(`✗ Fila ${n} (${num_empleado}): departamento no reconocido "${deptoRaw}"`); fail++; continue; }

    const id_sucursal = resolverSucursal(sucRaw);
    if (sucRaw && !id_sucursal) { console.log(`✗ Fila ${n} (${num_empleado}): sucursal no reconocida "${sucRaw}"`); fail++; continue; }

    if (dryRun) {
      console.log(`✓ Fila ${n} (${num_empleado}): ${nombre} ${ap_paterno} — válido (rol ${id_rol}, depto ${id_departamento}, suc ${id_sucursal ?? "—"})`);
      ok++;
      continue;
    }

    try {
      const hash = await bcrypt.hash(password, 12);
      const id = await Empleado.crear({
        num_empleado, nombre, ap_paterno,
        ap_materno: ap_materno || "",
        email, password: hash,
        id_rol, id_departamento,
        id_sucursal: id_sucursal ?? null,
      });
      console.log(`✓ Fila ${n} (${num_empleado}): creado con id ${id}`);
      ok++;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") console.log(`✗ Fila ${n} (${num_empleado}): ya existe (correo o número de empleado duplicado)`);
      else console.log(`✗ Fila ${n} (${num_empleado}): error BD — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nResumen: ${ok} ok, ${fail} con error, de ${rows.length} fila(s).${dryRun ? "  (DRY-RUN)" : ""}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error("Error fatal:", e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
