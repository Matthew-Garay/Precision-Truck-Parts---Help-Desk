import mysql from 'mysql2/promise';
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '@PrecisionTrucks123.',
  database: 'precision_helpdesk'
});
try {
  const [rows] = await pool.query('SELECT e.id_empleado, CONCAT(e.nombre, ' ' , e.ap_paterno) AS nombre_completo, e.id_sucursal, s.nombre_sucursal FROM empleado e LEFT JOIN sucursal s ON e.id_sucursal = s.id_sucursal ORDER BY e.id_empleado');
  console.log('Empleados:', JSON.stringify(rows, null, 2));
} catch (err) {
  console.error('Error:', err.message);
}
