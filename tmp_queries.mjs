import pool from "./server/config/db.js";
import { generarFolio } from "./server/utils/helpers.js";

async function crearSolicitud() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Generar folio para septiembre 2026 - el sistema usa la fecha actual
    // Para SAL-202609-0001, necesitamos simular septiembre 2026
    const ahora = new Date(2026, 8, 25); // mes 8 = septiembre (0-indexed)
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0"); // 09
    
    // Manual generation for specific date
    const segmento = `SAL-${anio}${mes}-`;
    
    // Verificar el último número secuencial para septiembre 2026
    const [rows] = await conn.query(
      `SELECT folio_solicitud FROM solicitud WHERE folio_solicitud LIKE ? ORDER BY CAST(SUBSTRING_INDEX(folio_solicitud, '-', -1) AS UNSIGNED) DESC LIMIT 1`,
      [`${segmento}%`]
    );
    
    const ultimo = rows[0]?.[ 'folio_solicitud' ];
    const num = ultimo ? parseInt(ultimo.split('-').pop(), 10) + 1 : 1;
    const folio = `${segmento}${String(num).padStart(4, "0")}`;
    
    console.log(`Folio generado: ${folio}`);
    
    // Insertar solicitud con el folio específico y fecha 25/09/2026
    const [result] = await conn.query(
      `INSERT INTO solicitud (folio_solicitud, fecha, id_empleado, estatus, observacion) VALUES (?, ?, ?, 'En proceso', NULL)`,
      [folio, '2026-09-25', 101] // Usando empleado 101 (Jennifer) como ejemplo
    );
    
    console.log(`Solicitud creada: id=${result.insertId}, folio=${folio}, fecha=2026-09-25`);
    
    await conn.commit();
    console.log('✅ Transacción completada');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error:', err);
  } finally {
    conn.release();
  }
}

crearSolicitud();