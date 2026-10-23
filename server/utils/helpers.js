/**
 * helpers.js
 *
 * Utilidades transaccionales compartidas por los modelos del sistema.
 *
 * FUNCIÓN PRINCIPAL: generarFolio(conn, tabla, campoFolio, prefijo)
 * ─────────────────────────────────────────────────────────────────
 * Genera un folio secuencial con formato <PREFIJO>-YYYYMMDD-NNNN de forma
 * segura bajo alta concurrencia mediante bloqueo exclusivo FOR UPDATE.
 *
 * Estrategia anti-race-condition:
 *   1. Se ejecuta DENTRO de una transacción InnoDB abierta por el llamador.
 *   2. SELECT ... FOR UPDATE adquiere un IX lock sobre el índice UNIQUE del
 *      folio, bloqueando cualquier otra transacción concurrente que intente
 *      leer el mismo rango hasta que la transacción actual haga COMMIT o
 *      ROLLBACK. Esto garantiza que dos conexiones simultáneas nunca lean
 *      el mismo "último número" y produzcan folios duplicados.
 *   3. El número secuencial (NNNN) se reinicia automáticamente cada mes al
 *      cambiar el segmento YYYYMM del prefijo.
 *
 * Parámetros:
 *   @param {import('mysql2/promise').PoolConnection} conn
 *     Conexión con transacción activa (beginTransaction ya invocado).
 *   @param {string} tabla       Nombre de la tabla MySQL  (ej. "ticket")
 *   @param {string} campoFolio  Nombre de la columna      (ej. "folio_ticket")
 *   @param {string} prefijo     Prefijo del folio         (ej. "ST" | "SAL")
 *
 * Retorna:
 *   @returns {Promise<string>}  Folio generado, ej. \"ST-202610-0001\" / \"SAL-202610-0001\"
 *
 * Uso en Ticket.js:
 *   import { generarFolio } from './helpers.js';
 *   const folio = await generarFolio(conn, "ticket",    "folio_ticket",    "ST");
 *
 * Uso en Solicitud.js:
 *   import { generarFolio } from './helpers.js';
 *   const folio = await generarFolio(conn, "solicitud", "folio_solicitud", "SAL");
 */

/**
 * Genera un folio secuencial seguro con bloqueo FOR UPDATE.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {string} tabla
 * @param {string} campoFolio
 * @param {string} prefijo
 * @returns {Promise<string>}
 */
/**
 * Indica si la aplicacion esta ejecutándose en entorno de produccion.
 * Centralizado para evitar copias duplicadas de `isProd` en cada controlador.
 */
export const isProd = () => process.env.NODE_ENV === "production";

export async function generarFolio(conn, tabla, campoFolio, prefijo) {
  const ahora   = new Date();
  const anio    = ahora.getFullYear();
  const dia     = String(ahora.getDate()).padStart(2, "0");
  // Sin prefijo el folio queda YYYYMMDD-NNNN (ej. 20261006-0001). Si se pasa un
  // prefijo se antepone: PREFIJO-YYYYMMDD-NNNN. El numero se reinicia cada dia.
  const segmento = prefijo ? `${prefijo}-${anio}${dia}-` : `${anio}${dia}-`;

  // FOR UPDATE: bloquea las filas del mes actual hasta el COMMIT del llamador.
  // CAST(...AS UNSIGNED) ordena numéricamente para obtener el último NNN real,
  // evitando el orden lexicográfico incorrecto ("009" > "010" como string).
  const [rows] = await conn.query(
    `SELECT ${campoFolio}
     FROM ${tabla}
     WHERE ${campoFolio} LIKE ?
     ORDER BY CAST(SUBSTRING_INDEX(${campoFolio}, '-', -1) AS UNSIGNED) DESC
     LIMIT 1
     FOR UPDATE`,
    [`${segmento}%`]
  );

  const ultimo = rows[0]?.[campoFolio];
  const num    = ultimo ? parseInt(ultimo.split("-").pop(), 10) + 1 : 1;

  return `${segmento}${String(num).padStart(4, "0")}`;
}
