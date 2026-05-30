import express           from "express";
import { createServer }  from "http";
import { Server }        from "socket.io";
import cors              from "cors";
import helmet            from "helmet";
import dotenv            from "dotenv";
import jwt               from "jsonwebtoken";
import path              from "path";
import fs                from "fs";
import { fileURLToPath } from "url";
import pool              from "./Config/db.js";
import { requireAuth }   from "./Middlewares/authMiddleware.js";
import { iniciarWorkers } from "./Workers/scheduledJobs.js";
import categoriasRoutes  from "./Routes/categoriasRoutes.js";
import authRoutes        from "./Routes/authRoutes.js";
import ticketsRoutes     from "./Routes/ticketsRoutes.js";
import solicitudesRoutes from "./Routes/solicitudesRoutes.js";

dotenv.config();

const REQUIRED_ENV = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missing.join(", ")}`);
  process.exit(1);
}

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const app        = express();
const httpServer = createServer(app);
const PORT       = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// -- Socket.io ------------------------------------------------
export const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No autorizado"));
  try {
    socket.data.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Token invalido"));
  }
});

io.on("connection", (socket) => {
  const { id_empleado, id_rol } = socket.data.usuario;
  socket.join(`empleado_${id_empleado}`);
  if (id_rol === 1) socket.join("admins");
});

// -- Middlewares globales -------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy:            { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "blob:"],
      fontSrc:     ["'self'", "data:"],
      connectSrc:  ["'self'", CORS_ORIGIN],
      objectSrc:   ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  xContentTypeOptions: true,
  xFrameOptions: { action: "deny" },
}));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use("/storage", express.static(path.resolve(__dirname, "../../storage")));
app.use("/fotos",   express.static(path.resolve(__dirname, "../../storage/Fotos de Perfil")));

// -- Rutas ----------------------------------------------------
app.get("/api/ping", (_req, res) => res.json({ status: "ok", message: "Servidor HelpDesk activo ✅" }));

app.use("/api/categorias",  categoriasRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/tickets",     ticketsRoutes);
app.use("/api/solicitudes", solicitudesRoutes);

// -- Manuales (PDFs de storage/Manuales/) ---------------------
app.get("/api/manuales", requireAuth, (req, res) => {
  const dir = path.resolve(__dirname, "../../storage/Manuales");
  try {
    if (!fs.existsSync(dir)) return res.json([]);
    const archivos = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(".pdf"))
      .map(f => {
        let tamaño = "-";
        try {
          const s = fs.statSync(path.join(dir, f)).size;
          tamaño = s < 1024 * 1024 ? `${(s / 1024).toFixed(0)} KB` : `${(s / 1024 / 1024).toFixed(1)} MB`;
        } catch { /* archivo no accesible */ }
        return { nombre: f, url: `/storage/Manuales/${encodeURIComponent(f)}`, tamaño };
      });
    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: "Error al leer manuales", detalle: err.message });
  }
});

// -- Middleware global de errores -----------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[Error no manejado]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Error interno del servidor" });
});

// -- Arranque -------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  iniciarWorkers(io);
});
