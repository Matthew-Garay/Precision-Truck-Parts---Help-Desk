import pool from "./server/config/db.js";

try {
  const [rows] = await pool.query("SELECT * FROM solicitud WHERE folio_solicitud = ?", ["SAL-202609-0001"]);
  console.log("Registros SAL-202609-0001:", rows.length);
  rows.forEach(row => {
    console.log("  - id:", row.id_solicitud, "| folio:", row.folio_solicitud, "| fecha:", row.fecha, "| estatus:", row.estatus, "| empleado_id:", row.id_empleado);
  });
} catch (err) {
  console.error("Error al consultar:", err.message);
} finally {
  await pool.end();
}