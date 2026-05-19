import express          from "express";
import cors             from "cors";
import dotenv           from "dotenv";
import path             from "path";
import fs               from "fs";
import { fileURLToPath } from "url";
import pool             from "./Config/db.js";
import categoriasRoutes   from "./Routes/categoriasRoutes.js";
import authRoutes         from "./Routes/authRoutes.js";
import ticketsRoutes      from "./Routes/ticketsRoutes.js";
import solicitudesRoutes  from "./Routes/solicitudesRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use("/storage", express.static(path.resolve(__dirname, "../../storage")));
app.use("/fotos",   express.static(path.resolve(__dirname, "../../storage/Fotos de Perfil")));

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Servidor HelpDesk activo ✅" });
});

app.use("/api/categorias",   categoriasRoutes);
app.use("/api/auth",         authRoutes);
app.use("/api/tickets",      ticketsRoutes);
app.use("/api/solicitudes",  solicitudesRoutes);

// ── Endpoint manuales (lee PDFs de storage/Manuales/) ───────
app.get("/api/manuales", (req, res) => {
  const dir = path.resolve(__dirname, "../../storage/Manuales");
  try {
    if (!fs.existsSync(dir)) return res.json([]);
    const archivos = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(".pdf"))
      .map(f => ({
        nombre:  f,
        url:     `/storage/Manuales/${encodeURIComponent(f)}`,
        tamaño:  (() => { try { const s = fs.statSync(path.join(dir, f)).size; return s < 1024*1024 ? `${(s/1024).toFixed(0)} KB` : `${(s/1024/1024).toFixed(1)} MB`; } catch { return "—"; } })(),
      }));
    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: "Error al leer manuales", detalle: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// ── Limpieza periódica de sesiones huérfanas ────────────────────────────
setInterval(async () => {
  try {
    const [result] = await pool.query(
      `UPDATE historial_acceso
       SET fecha_salida = NOW()
       WHERE fecha_salida IS NULL
       AND fecha_entrada < DATE_SUB(NOW(), INTERVAL 12 HOUR)`
    );
    if (result.affectedRows > 0)
      console.log(`🧹 Sesiones huérfanas cerradas: ${result.affectedRows}`);
  } catch (err) {
    console.error("Error limpiando sesiones huérfanas:", err.message);
  }
}, 60 * 60 * 1000); // cada hora
