const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '@PrecisionTrucks123.',
  database: 'precision_helpdesk'
});
(async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM empleado');
    console.log('Empleados:', rows[0].count);
    const [srows] = await pool.query('SELECT COUNT(*) as count FROM sucursal');
    console.log('Sucursales:', srows[0].count);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
