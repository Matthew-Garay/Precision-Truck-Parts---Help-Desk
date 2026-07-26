/**
 * db.js
 *
 * Configura y exporta el pool de conexiones a la base de datos MySQL.
 * Utiliza mysql2/promise para conexiones asincronas con soporte de promesas nativas.
 *
 * La configuracion se toma completamente de variables de entorno cargadas por dotenv:
 *   DB_HOST     - host del servidor MySQL
 *   DB_PORT     - puerto del servidor MySQL
 *   DB_USER     - usuario de la base de datos
 *   DB_PASSWORD - contrasena del usuario
 *   DB_NAME     - nombre de la base de datos
 *   DB_SSL      - si es "true" y el host no es localhost, activa SSL con verificacion de certificado
 *
 * El pool permite un maximo de 10 conexiones simultaneas, cola ilimitada y un timeout
 * de 10 segundos por conexion. La zona horaria esta fijada en -06:00 (Hermosillo, Mexico)
 * para que todas las fechas almacenadas y leidas sean consistentes con el horario local.
 *
 * Al iniciar el modulo se intenta obtener una conexion de prueba. Si falla, el proceso
 * termina con codigo 1 para evitar que el servidor arranque sin base de datos disponible.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });

// Pool de conexiones a MySQL. Se reutilizan conexiones en lugar de abrir una nueva
// por cada peticion, lo que mejora el rendimiento bajo carga concurrente.
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    100,
  queueLimit:         500,
  connectTimeout:     30000,
  timezone:           "-06:00",
  namedPlaceholders:  false,
  decimalNumbers:     true,
  ...(process.env.DB_HOST !== "localhost" && process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => { conn.release(); })
  .catch(err => {
    console.error("\u274c MySQL \u2014 no se pudo conectar:", err.message);
    process.exit(1);
  });

export default pool;
