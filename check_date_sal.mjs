import pool from "./server/config/db.js";

const [rows] = await pool.query(
  "SELECT id_solicitud, folio_solicitud, fecha, estatus, prioridad, fecha_atencion FROM solicitud WHERE folio_solicitud = ?",
  ["SAL-202609-0001"]
);

console.log("Registros SAL-202609-0001:");
rows.forEach(row => {
  console.log("  - id:", row.id_solicitud, "| folio:", row.folio_solicitud, "| fecha:", row.fecha, "| estatus:", row.estatus, "| prioridad:", row.prioridad, "| fecha_atencion:", row.fecha_atencion);
});
