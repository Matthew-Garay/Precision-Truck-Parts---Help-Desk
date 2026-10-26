import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "@PrecisionTrucks123.",
  database: "precision_helpdesk",
  connectTimeout: 5000
});

try {
  const [rows] = await pool.query(
    "SELECT id_solicitud, folio_solicitud, fecha, estatus, prioridad, fecha_atencion FROM solicitud WHERE folio_solicitud = 'SAL-202609-0001'"
  );
  
  console.log("Registros SAL-202609-0001:");
  rows.forEach(row => {
    console.log("  - id:", row.id_solicitud);
    console.log("  - folio:", row.folio_solicitud);
    console.log("  - fecha:", row.fecha);
    console.log("  - estatus:", row.estatus);
    console.log("  - prioridad:", row.prioridad);
    console.log("  - fecha_atencion:", row.fecha_atencion);
  });
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await pool.end();
}
