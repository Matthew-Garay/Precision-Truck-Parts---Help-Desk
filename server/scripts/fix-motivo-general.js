import pool from "../config/db.js";

const MOTIVO_VIEJO_PATTERN = "Entrega de proveedor de Alejandro Vera";

try {
  // 1) Buscar ANY filas que contengan el patrón (usando LIKE - más amplio que = exacto)
  const [antes] = await pool.query(
    `SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad, m.motivo, m.fecha
     FROM movimiento_inventario m
     INNER JOIN insumo i ON m.id_insumo = i.id_insumo
     WHERE m.motivo LIKE ?`,
    [`%${MOTIVO_VIEJO_PATTERN}%`]
  );
  console.log("Filas con patrón viejo:", JSON.stringify(antes, null, 2));
  console.log("Total:",antes.length);

  if (antes.length > 0) {
    // 2) Actualizar todas las filas encontradas
    const [r] = await pool.query(
      `UPDATE movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
       SET m.motivo = ?
       WHERE m.motivo LIKE ?`,
      [`Entrega de proveedor de Jose Alejandro Vera Atilano`, `%${MOTIVO_VIEJO_PATTERN}%`]
    );
    console.log(`Filas actualizadas: ${r.affectedRows}`);

    // 3) Ver DESPUÉS
    const [despues] = await pool.query(
      `SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad, m.motivo, m.fecha
       FROM movimiento_inventario m
       INNER JOIN insumo i ON m.id_insumo = i.id_insumo
       WHERE m.motivo LIKE ?`,
      [`%${MOTIVO_VIEJO_PATTERN}%`]
    );
    console.log("Quedaron filas con patrón viejo:", JSON.stringify(despues, null, 2));
  } else {
    console.log("No se encontraron filas con el patrón viejo.");
  }

} catch (err) {
  console.error("ERROR:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}