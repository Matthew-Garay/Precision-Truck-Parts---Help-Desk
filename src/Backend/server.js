import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import "./Config/db.js"; // inicia y verifica la conexión a MySQL

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" })); // permite peticiones desde el Frontend
app.use(express.json());                             // procesa JSON en las peticiones

// ── RUTA DE PRUEBA ────────────────────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Servidor HelpDesk activo ✅" });
});

// ── RUTAS (se agregarán aquí conforme crezca el proyecto) ─────
// import authRoutes        from "./Routes/authRoutes.js";
// import ticketsRoutes     from "./Routes/ticketsRoutes.js";
// import refaccionesRoutes from "./Routes/refaccionesRoutes.js";
// app.use("/api/auth",        authRoutes);
// app.use("/api/tickets",     ticketsRoutes);
// app.use("/api/refacciones", refaccionesRoutes);

// ── INICIAR SERVIDOR ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
