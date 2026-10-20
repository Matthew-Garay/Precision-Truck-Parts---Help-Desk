import mysql from 'mysql2/promise';
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '@PrecisionTrucks123.',
  database: 'precision_helpdesk'
});
try {
  const [rows] = await pool.query('SELECT id_sucursal, nombre_sucursal FROM sucursal ORDER BY id_sucursal');
  console.log('Sucursales:', JSON.stringify(rows, null, 2));
} catch (err) {
  console.error('Error:', err.message);
}
