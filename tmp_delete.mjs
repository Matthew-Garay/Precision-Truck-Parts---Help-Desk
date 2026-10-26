import pool from "./server/config/db.js";

pool.query("DELETE FROM solicitud WHERE folio_solicitud = 'SAL-202609-0001'").then(r => {
  console.log('Filas afectadas:', r[0].affectedRows);
}).catch(err => console.error('Error:', err));