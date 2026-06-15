import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Pool de conexiones
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     10000,
  timezone:           "-06:00",
  ...(process.env.DB_HOST !== "localhost" && process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log("✅ Conexión a MySQL establecida correctamente");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al conectar con MySQL:", err.message);
    process.exit(1);
  });

export default pool;
