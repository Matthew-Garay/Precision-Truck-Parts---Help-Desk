/**
 * fix-motivo-drum-xerox.js
 *
 * Guarda en la BASE DE DATOS el motivo del movimiento de ENTRADA del insumo
 * "Drum Xerox WorkCentre 3225" (stock inicial +3):
 *   "Stock inicial al ingresar el insumo"
 *     -> "Entrega de proveedor de Jose Alejandro Vera Atilano"
 *
 * Uso:  node scripts/fix-motivo-drum-xerox.js
 */
import pool from "../config/db.js";

const MOTIVO_VIEJO = "Entrega de proveedor de Alejandro Vera";
const MOTIVO_NUEVO = "Entrega de proveedor de Jose Alejandro Vera Atilano";

try {
  // 1) Ver ANTES cómo está la fila
  const [antes] = await pool.query(
    `SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad,
            m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha
       FROM movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
      WHERE i.nombre = ? AND m.tipo = 'Entrada' AND m.motivo = ?`,
    [NOMBRE_INSUMO, MOTIVO_VIEJO]
  );
  console.log("ANTES:", JSON.stringify(antes, null, 2));

  if (antes.length === 0) {
    console.log("No se encontró la fila con el motivo viejo. Buscando cualquier entrada del insumo...");
    const [todas] = await pool.query(
      `SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad, m.motivo, m.fecha
         FROM movimiento_inventario m
         INNER JOIN insumo i ON m.id_insumo = i.id_insumo
        WHERE i.nombre = ?`,
      [NOMBRE_INSUMO]
    );
    console.log("FILAS DEL INSUMO:", JSON.stringify(todas, null, 2));
    process.exit(0);
  }

  // 2) Cambiar el motivo
  const [r] = await pool.query(
    `UPDATE movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
        SET m.motivo = ?
      WHERE i.nombre = ? AND m.tipo = 'Entrada' AND m.motivo = ?`,
    [MOTIVO_NUEVO, NOMBRE_INSUMO, MOTIVO_VIEJO]
  );
  console.log(`Filas actualizadas: ${r.affectedRows}`);

  // 3) Ver DESPUÉS que quedó aplicado
  const [despues] = await pool.query(
    `SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad,
            m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha
       FROM movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
      WHERE i.nombre = ?`,
    [NOMBRE_INSUMO]
  );
  console.log("DESPUÉS:", JSON.stringify(despues, null, 2));
} catch (err) {
  console.error("ERROR:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
