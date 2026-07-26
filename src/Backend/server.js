/**
 * server.js
 *
 * Punto de entrada del servidor backend de PrecisionTrucks HelpDesk.
 *
 * Responsabilidades en orden de ejecucion:
 *
 * 1. Valida que las variables de entorno criticas esten definidas antes de arrancar.
 *    Si alguna falta el proceso termina inmediatamente con codigo 1.
 *
 * 2. Crea la aplicacion Express, el servidor HTTP nativo y la instancia de Socket.io
 *    montada sobre ese servidor HTTP (no sobre Express directamente).
 *
 * 3. Configura la autenticacion de Socket.io: cada conexion entrante debe presentar
 *    un JWT valido en socket.handshake.auth.token. El socket se une automaticamente
 *    a la sala "empleado_{id}" y, si el rol es 1 (admin), tambien a la sala "admins".
 *    Esto permite enviar notificaciones dirigidas por rol o por empleado especifico.
 *
 * 4. Aplica middlewares globales:
 *    - compression : comprime las respuestas HTTP con gzip/deflate
 *    - helmet      : establece cabeceras de seguridad HTTP (CSP, CORP, HSTS, etc.)
 *                    CORP se relaja a "cross-origin" para que el visor de PDF pueda
 *                    leer los archivos servidos desde /storage
 *    - cors        : restringe las peticiones al origen definido en CORS_ORIGIN
 *    - express.json: parsea el cuerpo JSON con limite de 2 MB
 *
 * 5. Sirve archivos estaticos:
 *    - /storage : archivos de evidencias, manuales y fotos (bloquea .json y .env)
 *    - /fotos   : carpeta de fotos de perfil, requiere autenticacion JWT
 *
 * 6. Registra todas las rutas de la API bajo los prefijos:
 *    /api/auth        - autenticacion, empleados y recuperacion de contrasena
 *    /api/categorias  - catalogo de categorias
 *    /api/tickets     - gestion completa de tickets de soporte
 *    /api/solicitudes - solicitudes de insumos e inventario
 *    /api/manuales    - subida, edicion y eliminacion de manuales PDF (inline en este archivo)
 *
 * 7. Inicia los workers de tareas programadas (scheduledJobs) pasandoles la
 *    instancia de io para que puedan emitir eventos de Socket.io.
 *
 * 8. Escucha en el puerto definido en la variable PORT (por defecto 3001).
 *
 * Nota: POST /api/auth/refresh-token esta implementado en authRoutes.js.
 *
 * Variables de entorno requeridas:
 *   JWT_SECRET   - clave secreta para firmar y verificar tokens JWT
 *   DB_HOST      - host de la base de datos MySQL
 *   DB_USER      - usuario de la base de datos
 *   DB_PASSWORD  - contrasena de la base de datos
 *   DB_NAME      - nombre de la base de datos
 *
 * Variables de entorno opcionales:
 *   PORT         - puerto de escucha (default: 3001)
 *   CORS_ORIGIN  - origen permitido para CORS (default: http://localhost:5173)
 *   NODE_ENV     - entorno de ejecucion (production activa trust proxy y oculta detalles de error)
 */
import { resolve, dirname } from "path";
import { fileURLToPath }   from "url";

import express           from "express";
import { createServer }  from "http";
import { networkInterfaces } from "os";
import { Server }        from "socket.io";
import cors              from "cors";
import compression       from "compression";
import helmet            from "helmet";
import jwt               from "jsonwebtoken";
import path              from "path";
import pool              from "./Config/db.js";
import { requireAuth }   from "./Middlewares/authMiddleware.js";
import { setIO }         from "./Config/socketInstance.js";
import { iniciarWorkers, getStockEnviadoHoy } from "./Workers/scheduledJobs.js";
import categoriasRoutes  from "./Routes/categoriasRoutes.js";
import authRoutes        from "./Routes/authRoutes.js";
import ticketsRoutes     from "./Routes/ticketsRoutes.js";
import solicitudesRoutes from "./Routes/solicitudesRoutes.js";
import manualesRoutes    from "./Routes/manualesRoutes.js";

const REQUIRED_ENV = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${missing.join(", ")}`);
  process.exit(1);
}

const __dirname  = dirname(fileURLToPath(import.meta.url));
const app        = express();
const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout   = 70000;
httpServer.maxConnections   = 500;
const PORT       = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CORS_ORIGINS = CORS_ORIGIN;

// -- Socket.io ------------------------------------------------
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ["GET", "POST"], credentials: true },
  allowEIO3: true,
});
setIO(io);

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

io.on("connection", async (socket) => {
  const { id_empleado, id_rol } = socket.data.usuario;
  socket.join(`empleado_${id_empleado}`);
  if (id_rol !== 1) return;
  socket.join("admins");

  // Al conectarse un admin, emitirle los insumos con stock bajo (≤ 2) — solo 1 vez por día
  try {
    const stockEnviadoHoy = getStockEnviadoHoy();
    if (!stockEnviadoHoy) return; // workers aún no iniciados
    const hoy = new Date().toISOString().slice(0, 10);
    if (stockEnviadoHoy.get(id_empleado) === hoy) return; // ya se envió hoy

    const [criticos] = await pool.query(
      `SELECT id_insumo, nombre, stock, imagen_url
       FROM insumo WHERE stock <= 2 ORDER BY stock ASC, nombre ASC LIMIT 50`
    );
    if (criticos.length === 0) return;

    criticos.forEach(ins => {
      socket.emit("insumo:stock_critico", {
        id_insumo:  ins.id_insumo,
        nombre:     ins.nombre,
        stock:      ins.stock,
        nivel:      ins.stock === 0 ? "agotado" : "bajo",
        imagen_url: ins.imagen_url || null,
      });
    });
    stockEnviadoHoy.set(id_empleado, hoy);
  } catch { /* no bloquear la conexión si falla */ }
});

// -- Handlers de proceso no controlado -----------------------
process.on("uncaughtException",  (err) => console.error("[uncaughtException]",  err));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

// -- Graceful shutdown: SIGTERM (PM2/Docker) y SIGINT (Ctrl+C) ----
// Cierra conexiones activas y el pool MySQL antes de salir.
// Timeout de 10s para evitar colgarse indefinidamente.
const shutdown = (signal) => {
  httpServer.close(async () => {
    try { await pool.end(); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// -- Trust proxy (necesario para rate-limit detrás de Nginx/Apache) ----
// '1' = confiar en el primer proxy inverso (el inmediato)
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// -- Middlewares globales -------------------------------------
app.use(compression({ level: 6, threshold: 1024 }));
app.use(helmet({
  crossOriginResourcePolicy:  { policy: "cross-origin" },
  crossOriginOpenerPolicy:    false,
  originAgentCluster:         false,
  referrerPolicy:             { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      workerSrc:   ["'self'", "blob:"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      styleSrcElem:["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "blob:"],

      connectSrc:  (() => {
        const hosts = new Set([`localhost:${PORT}`]);
        try { if (process.env.APP_URL) hosts.add(new URL(process.env.APP_URL).host); } catch {}
        try { if (process.env.CORS_ORIGIN) hosts.add(new URL(process.env.CORS_ORIGIN).host); } catch {}
        const list = ["'self'"];
        for (const h of hosts) { list.push(`ws://${h}`, `wss://${h}`); }
        return list;
      })(),
      objectSrc:      ["'none'"],
      frameSrc:       ["'self'", "blob:"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  xContentTypeOptions: true,
  xFrameOptions: false,
}));
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use((_req, res, next) => { res.setHeader("ngrok-skip-browser-warning", "1"); next(); });
app.use(express.json({ limit: "2mb" }));
// Excluir archivos sensibles del servidor estático
app.use("/storage", (req, res, next) => {
  const blocked = /(\.json|\.env)$/i;
  if (blocked.test(req.path)) return res.status(403).json({ error: "Acceso no permitido" });
  if (/\.pdf$/i.test(req.path)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  // Cache de 7 días para imágenes y PDFs (son inmutables una vez subidos)
  if (/\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  }
  next();
}, express.static(path.resolve(__dirname, "../../storage")));
app.use("/fotos", requireAuth, express.static(path.resolve(__dirname, "../../storage/Fotos de Perfil")));

// -- Rutas ----------------------------------------------------
app.get("/api/ping", (_req, res) => res.json({ status: "ok", message: "Servidor HelpDesk activo ✅" }));

// Health endpoint: estado del pool de conexiones
app.get("/api/health", requireAuth, (_req, res) => {
  const poolInfo = pool.pool?.pool ?? {};
  res.json({
    status:      "ok",
    uptime:      Math.floor(process.uptime()),
    memory_mb:   Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    connections: {
      total:   poolInfo._allConnections?.length    ?? "n/a",
      free:    poolInfo._freeConnections?.length   ?? "n/a",
      queue:   poolInfo._connectionQueue?.length   ?? "n/a",
    },
    node_env: process.env.NODE_ENV || "development",
  });
});

// Cache-Control: no-store en rutas sensibles de auth
app.use("/api/auth", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/categorias",  categoriasRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/tickets",     ticketsRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/manuales",    manualesRoutes);

// -- 404 en rutas /api/ → siempre JSON, nunca HTML ------------------
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// -- Servir frontend en producción ------------------------------------
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

// -- Middleware global de errores -----------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[Error no manejado]", err);
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    error: isProd && status === 500 ? "Error interno del servidor" : (err.message || "Error interno del servidor"),
  });
});

// -- Arranque -------------------------------------------------
httpServer.listen(PORT, "0.0.0.0", async () => {
  const line = "─".repeat(52);
  const ok   = "✅";
  const fail = "❌";

  console.log(`\n${line}`);
  console.log(`  Precision Trucks Parts — HelpDesk`);
  console.log(line);

  // URLs de acceso
  console.log(`  Backend  →  http://localhost:${PORT}`);
  console.log(`  Frontend →  http://localhost:5173`);
  if (process.env.APP_URL) console.log(`  Público  →  ${process.env.APP_URL}`);
  const nets = networkInterfaces();
  for (const iface of Object.values(nets))
    for (const addr of iface)
      if (addr.family === "IPv4" && !addr.internal)
        console.log(`  Red      →  http://${addr.address}:${PORT}  (LAN)`);

  // Base de datos
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log(`  DB       →  ${ok} MySQL`);
  } catch {
    console.log(`  DB       →  ${fail} MySQL sin conexión`);
  }

  // Socket.io — verificar que el servidor está escuchando
  console.log(`  Socket   →  ${httpServer.listening ? ok : fail} WebSockets`);

  // Workers
  console.log(`  Workers  →  ${ok} Iniciando jobs programados`);

  // SMTP
  console.log(`  SMTP     →  ${process.env.SMTP_USER ? ok : "⚠️ "} ${process.env.SMTP_USER ? "Correos activos" : "No configurado — correos desactivados"}`);

  // JWT
  console.log(`  JWT      →  ${process.env.JWT_SECRET ? ok : fail} ${process.env.JWT_SECRET ? "Configurado" : "JWT_SECRET faltante"}`);

  console.log(line + "\n");

  iniciarWorkers(io);
});
