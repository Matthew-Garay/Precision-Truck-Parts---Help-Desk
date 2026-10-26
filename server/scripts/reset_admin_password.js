// scripts/reset_admin_password.js
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const email = "matthew.garay@ptp.com.mx";
  const newPassword = "Admin123!@#";
  const hash = await bcrypt.hash(newPassword, 12);

  const [result] = await pool.query(
    "UPDATE empleado SET password = ? WHERE email = ?",
    [hash, email]
  );
  console.log("Updated rows:", result.affectedRows);
  console.log("New password hash:", hash);
  pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
