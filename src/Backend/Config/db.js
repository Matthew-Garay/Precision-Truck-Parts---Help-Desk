import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Pool de conexiones - reutiliza conexiones activas en lugar de abrir una nueva cada vez
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,       // máximo 10 conexiones simultáneas
  queueLimit:         0,
  timezone:           "-06:00", // zona horaria México Centro
});

// Verificar conexión al iniciar el servidor
pool.getConnection()
  .then(conn => {
    console.log("✅ Conexión a MySQL establecida correctamente");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al conectar con MySQL:", err.message);
    process.exit(1); // detiene el servidor si no hay conexión
  });

export default pool;
