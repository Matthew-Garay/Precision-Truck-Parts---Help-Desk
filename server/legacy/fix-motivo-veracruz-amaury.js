/**
 * fix-motivo-veracruz-amaury.js
 *
 * Actualiza en la BASE DE DATOS el motivo del movimiento de inventario
 * "Traída de Veracruz por Amaury" ->
 * "Traída de Veracruz por Amaury Marcelo Vázquez Montes"
 *
 * Uso:  node scripts/fix-motivo-veracruz-amaury.js
 */
import pool from "../config/db.js";

const MOTIVO_VIEJO = "Traída de Veracruz por Amaury";
const MOTIVO_NUEVO = "Traída de Veracruz por Amaury Marcelo Vázquez Montes";

try {
  // 1) Ver ANTES cómo está la fila
  const [antes] = await pool.query(
    `SELECT m.id_movimiento, i.nombre AS insumo, m.tipo, m.cantidad,
            m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha,
            e.nombre AS empleado_nombre
       FROM movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
       INNER JOIN empleado e ON m.id_empleado = e.id_empleado
      WHERE m.motivo = ?`,
    [MOTIVO_VIEJO]
  );
  console.log("ANTES:", JSON.stringify(antes, null, 2));

  if (antes.length === 0) {
    console.log("No se encontró la fila con el motivo viejo.");
    process.exit(0);
  }

  // 2) Cambiar el motivo
  const [r] = await pool.query(
    `UPDATE movimiento_inventario m
       SET m.motivo = ?
     WHERE m.motivo = ?`,
    [MOTIVO_NUEVO, MOTIVO_VIEJO]
  );
  console.log(`Filas actualizadas: ${r.affectedRows}`);

  // 3) Ver DESPUÉS que quedó aplicado
  const [despues] = await pool.query(
    `SELECT m.id_movimiento, i.nombre AS insumo, m.tipo, m.cantidad,
            m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha,
            e.nombre AS empleado_nombre
       FROM movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
       INNER JOIN empleado e ON m.id_empleado = e.id_empleado
      WHERE m.motivo = ?`,
    [MOTIVO_NUEVO]
  );
  console.log("DESPUÉS:", JSON.stringify(despues, null, 2));
} catch (err) {
  console.error("ERROR:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}