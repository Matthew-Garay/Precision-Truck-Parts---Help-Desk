/**
 * _bd-prueba.js
 *
 * Prepara una base de datos DE PRUEBA para las pruebas automáticas. Nunca
 * toca la base real: usa `precision_helpdesk_test` (o TEST_DB_NAME) y se
 * niega a continuar si el nombre no termina en "_test".
 *
 * Cada archivo de prueba llama a `prepararBD()`, que:
 *   1. borra y vuelve a crear la base de prueba desde database/schema.sql
 *      (más las migraciones de database/migraciones si aún no están en el schema);
 *   2. inserta datos mínimos (roles, departamentos, sucursales, empleados,
 *      categoría e insumos con stock conocido);
 *   3. registra un Socket.io falso para que los controladores puedan emitir.
 *
 * Requisito: MySQL corriendo con el usuario de server/.env (se crea la base
 * de prueba con ese usuario).
 *
 * @module server/tests/_bd-prueba
 */
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

// La base de prueba se fija ANTES de cargar el .env (dotenv no sobrescribe
// variables ya definidas) y antes de importar el pool de conexiones.
process.env.DB_NAME  = process.env.TEST_DB_NAME || "precision_helpdesk_test";
process.env.NODE_ENV = "test";
if (!/_test$/.test(process.env.DB_NAME))
  throw new Error(`Por seguridad las pruebas solo corren contra una base *_test (recibido: ${process.env.DB_NAME})`);

await import("../load-env.js");
const mysql = (await import("mysql2/promise")).default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.resolve(__dirname, "../../database/schema.sql");

export const DB = process.env.DB_NAME;

/** Respuesta HTTP falsa para llamar a los controladores directamente. */
export function respuesta() {
  return {
    statusCode: 200, body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    cookie() { return this; }, clearCookie() { return this; },
  };
}

/** Petición falsa como administrador (id_empleado 1, rol 1). */
export const reqAdmin = (extra = {}) => ({
  usuario: { id_empleado: 1, id_rol: 1 }, params: {}, query: {}, body: {}, headers: {}, ...extra,
});

export async function prepararBD() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });
  try {
    let sql = fs.readFileSync(SCHEMA, "utf8")
      .replace(/CREATE DATABASE IF NOT EXISTS `precision_helpdesk`/g, `CREATE DATABASE IF NOT EXISTS \`${DB}\``)
      .replace(/USE `precision_helpdesk`;/g, `USE \`${DB}\`;`);
    await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``);
    await conn.query(sql);
    await conn.query(`USE \`${DB}\``);

    await conn.query(`
      INSERT INTO rol (id_rol, nombre_rol) VALUES (1, 'Administrador'), (2, 'Usuario');
      INSERT INTO departamento (id_departamento, nombre_departamento) VALUES (1, 'Soporte Técnico'), (2, 'Almacén');
      INSERT INTO sucursal (id_sucursal, nombre_sucursal) VALUES (1, 'Matriz'), (2, 'Sucursal Norte');
      INSERT INTO empleado (id_empleado, nombre, ap_paterno, email, password, id_rol, id_departamento, id_sucursal)
        VALUES (1, 'Admin',  'Uno', 'admin1@prueba.test', 'x', 1, 1, 1),
               (2, 'Admin',  'Dos', 'admin2@prueba.test', 'x', 1, 1, 1),
               (3, 'Usuario','Tres','usuario3@prueba.test','x', 2, 2, 2);
      INSERT INTO categoria (id_categoria, nombre_categoria) VALUES (1, 'Consumibles');
      INSERT INTO insumo (id_insumo, nombre, id_categoria, stock) VALUES
        (1, 'Tóner prueba',    1, 10),
        (2, 'Etiqueta prueba', 1, 5),
        (3, 'Ribbon prueba',   1, 1);
    `);
  } finally {
    await conn.end();
  }

  // Socket.io falso: los controladores emiten eventos, aquí se ignoran.
  const { setIO } = await import("../config/socket-instance.js");
  const falso = { to: () => falso, emit: () => true };
  try { setIO(falso); } catch { /* ya registrado en este proceso */ }

  // Vaciar cachés en memoria entre pruebas.
  const { cache } = await import("../config/cache.js");
  cache.delByPrefix?.("");
}

/** Cierra el pool para que el proceso de pruebas termine. */
export async function cerrarBD() {
  const { default: pool } = await import("../config/db.js");
  await pool.end();
}
