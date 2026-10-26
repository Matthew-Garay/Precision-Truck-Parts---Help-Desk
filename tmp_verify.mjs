import pool from "./server/config/db.js";

pool.query("SELECT id_solicitud, folio_solicitud, fecha, id_empleado, estatus FROM solicitud ORDER BY folio_solicitud").then(r => {
  console.log('Total solicitudes:', r[0].length);
  console.log('Solicitudes ordenadas por folio:');
  r[0].forEach(e => console.log(' -', e.id_solicitud, e.folio_solicitud, e.fecha, e.id_empleado, e.estatus));
}).catch(err => console.error('Error:', err));