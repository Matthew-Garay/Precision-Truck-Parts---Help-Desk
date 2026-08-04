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
 *    /api/manuales    - subida, edicion y eliminacion de manuales PDF
 *
 * 7. Inicia los workers de tareas programadas (scheduledJobs) pasandoles la
 *    instancia de io para que puedan emitir eventos de Socket.io.
 *
 * 8. Escucha en el puerto definido en la variable PORT (por defecto 3001).
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
  console.error(`[ERROR] Variables de entorno faltantes: ${missing.join(", ")}`);
  process.exit(1);
}

const __dirname  = dirname(fileURLToPath(import.meta.url));
const app        = express();
const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout   = 70000;
httpServer.maxConnections   = 500;
const PORT        = process.env.PORT || 3001;
const CORS_ORIGIN  = process.env.CORS_ORIGIN || "http://localhost:5173";
const CORS_ORIGINS = CORS_ORIGIN;

// -- Socket.io ------------------------------------------------
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ["GET", "POST"], credentials: true },
  allowEIO3: true,
});
setIO(io);

// Middleware de autenticacion de Socket.io.
// Verifica el JWT enviado en socket.handshake.auth.token antes de aceptar la conexion.
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

// Al conectarse, une al socket a su sala personal y a la sala de admins si corresponde.
// Tambien emite alertas de stock critico al admin si no se le enviaron hoy.
io.on("connection", async (socket) => {
  const { id_empleado, id_rol } = socket.data.usuario;
  socket.join(`empleado_${id_empleado}`);
  if (id_rol !== 1) return;
  socket.join("admins");

  try {
    const stockEnviadoHoy = getStockEnviadoHoy();
    if (!stockEnviadoHoy) return;
    const hoy = new Date().toISOString().slice(0, 10);
    if (stockEnviadoHoy.get(id_empleado) === hoy) return;

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
  } catch { /* no bloquear la conexion si falla la consulta de stock */ }
});

// -- Handlers de errores no capturados -----------------------
process.on("uncaughtException",  (err) => console.error("[uncaughtException]",  err));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

// -- Cierre ordenado del servidor ----------------------------
// Cierra conexiones activas y el pool MySQL antes de salir.
// Timeout de 10 segundos para evitar que el proceso se quede colgado.
const shutdown = (signal) => {
  httpServer.close(async () => {
    try { await pool.end(); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// En produccion se confia en el primer proxy inverso para obtener la IP real del cliente.
// Necesario para que express-rate-limit funcione correctamente detras de Nginx o Apache.
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

// Servidor de archivos estaticos para /storage.
// Bloquea el acceso a archivos .json y .env por seguridad.
// Aplica cabeceras de cache de 7 dias para imagenes y PDFs.
app.use("/storage", (req, res, next) => {
  const blocked = /(\.json|\.env)$/i;
  if (blocked.test(req.path)) return res.status(403).json({ error: "Acceso no permitido" });
  if (/\.pdf$/i.test(req.path)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  if (/\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  }
  next();
}, express.static(path.resolve(__dirname, "../../storage")));

// Las fotos de perfil requieren JWT valido para ser accedidas.
app.use("/fotos", requireAuth, express.static(path.resolve(__dirname, "../../storage/Fotos de Perfil")));

// -- Rutas ----------------------------------------------------
app.get("/api/ping", (_req, res) => res.json({ status: "ok", message: "Servidor HelpDesk activo" }));

// Endpoint de salud: retorna estado del pool de conexiones, memoria y uptime.
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

// Las rutas de autenticacion no deben ser cacheadas por el navegador ni proxies.
app.use("/api/auth", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/categorias",  categoriasRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/tickets",     ticketsRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/manuales",    manualesRoutes);

// Cualquier ruta /api/* no registrada retorna JSON con 404, nunca HTML.
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// En produccion, Express sirve el build del frontend para cualquier ruta no-API.
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

// Middleware global de errores. Captura cualquier error no manejado en los controladores.
// En produccion oculta el detalle del error 500 para no exponer informacion interna.
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
  const line = "-".repeat(52);

  console.log(`\n${line}`);
  console.log(`  Precision Trucks Parts - HelpDesk`);
  console.log(line);

  console.log(`  Backend  ->  http://localhost:${PORT}`);
  console.log(`  Frontend ->  ${process.env.APP_URL || "http://localhost:5173"}`);
  if (process.env.APP_URL) console.log(`  Publico  ->  ${process.env.APP_URL}`);

  const nets = networkInterfaces();
  for (const iface of Object.values(nets))
    for (const addr of iface)
      if (addr.family === "IPv4" && !addr.internal)
        console.log(`  Red      ->  http://${addr.address}:${PORT}  (LAN)`);

  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log(`  DB       ->  OK  MySQL`);
  } catch {
    console.log(`  DB       ->  ERROR  MySQL sin conexion`);
  }

  console.log(`  Socket   ->  ${httpServer.listening ? "OK" : "ERROR"}  WebSockets`);
  console.log(`  Workers  ->  OK  Iniciando jobs programados`);
  console.log(`  SMTP     ->  ${process.env.SMTP_USER ? "OK  Correos activos" : "AVISO  No configurado - correos desactivados"}`);
  console.log(`  JWT      ->  ${process.env.JWT_SECRET ? "OK  Configurado" : "ERROR  JWT_SECRET faltante"}`);

  console.log(line + "\n");

  iniciarWorkers(io);
});
