import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "@PrecisionTrucks123.",
  database: "precision_helpdesk"
});

try {
  // First, check the current record
  const [rows] = await pool.query(
    "SELECT id_solicitud, folio_solicitud, fecha, estatus, prioridad, fecha_atencion FROM solicitud WHERE folio_solicitud = ?",
    ["SAL-202609-0001"]
  );

  console.log("Registros SAL-202609-0001:");
  rows.forEach(row => {
    console.log("  - id:", row.id_solicitud, "| folio:", row.folio_solicitud, "| fecha:", row.fecha, "| estatus:", row.estatus, "| prioridad:", row.prioridad, "| fecha_atencion:", row.fecha_atencion);
  });

  if (rows.length > 0) {
    // Update the date to 2026-09-25
    const [updateResult] = await pool.query(
      "UPDATE solicitud SET fecha = ? WHERE folio_solicitud = ?",
      ["2026-09-25", "SAL-202609-0001"]
    );
    console.log("\nActualizacion completada:");
    console.log("  - Filas afectadas:", updateResult.affectedRows);
  }
} catch (err) {
  console.error("Error:", err);
} finally {
  await pool.end();
}
