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
 * 7. Implementa el endpoint POST /api/auth/refresh-token que renueva un JWT
 *    aun valido generando uno nuevo con 12 horas de vigencia.
 *
 * 8. Inicia los workers de tareas programadas (scheduledJobs) pasandoles la
 *    instancia de io para que puedan emitir eventos de Socket.io.
 *
 * 9. Escucha en el puerto definido en la variable PORT (por defecto 3001).
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
import express           from "express";
import { createServer }  from "http";
import { Server }        from "socket.io";
import cors              from "cors";
import compression       from "compression";
import helmet            from "helmet";
import dotenv            from "dotenv";
import jwt               from "jsonwebtoken";
import path              from "path";
import fs                from "fs";
import { fileURLToPath } from "url";
import pool              from "./Config/db.js";
import { requireAuth }   from "./Middlewares/authMiddleware.js";
import { setIO }         from "./Config/socketInstance.js";
import { iniciarWorkers } from "./Workers/scheduledJobs.js";
import categoriasRoutes  from "./Routes/categoriasRoutes.js";
import authRoutes        from "./Routes/authRoutes.js";
import ticketsRoutes     from "./Routes/ticketsRoutes.js";
import solicitudesRoutes from "./Routes/solicitudesRoutes.js";
import { uploadManual, MANUALES_DIR, nombreManual } from "./Middlewares/uploadManuales.js";
import { safeResolvePath } from "./Middlewares/security.js";
import Manual from "./Models/Manual.js";

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
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
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

io.on("connection", (socket) => {
  const { id_empleado, id_rol } = socket.data.usuario;
  socket.join(`empleado_${id_empleado}`);
  if (id_rol === 1) socket.join("admins");
});

// -- Handlers de proceso no controlado -----------------------
process.on("uncaughtException",  (err) => console.error("[uncaughtException]",  err));
process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

// -- Trust proxy (necesario para rate-limit detrás de Nginx/Apache) ----
// '1' = confiar en el primer proxy inverso (el inmediato)
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// -- Middlewares globales -------------------------------------
app.use(compression());
app.use(helmet({
  // CORP relajado globalmente para que pdfjs pueda leer los PDFs del /storage
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy:            { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      // blob: necesario para el worker de pdfjs-dist v6
      workerSrc:   ["'self'", "blob:"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "blob:"],
      fontSrc:     ["'self'", "data:"],
      connectSrc:  ["'self'", CORS_ORIGIN,
                    CORS_ORIGIN.replace(/^http/, "ws"),
                    `ws://localhost:${PORT}`,
                    `wss://localhost:${PORT}`],
      objectSrc:   ["'self'"],
      frameSrc:    ["'self'", "blob:"],
      frameAncestors: ["'self'", CORS_ORIGIN],
      upgradeInsecureRequests: [],
    },
  },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  xContentTypeOptions: true,
  xFrameOptions: false,
}));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
// Excluir archivos sensibles del servidor estático
app.use("/storage", (req, res, next) => {
  const blocked = /(\.json|\.env)$/i;
  if (blocked.test(req.path)) return res.status(403).json({ error: "Acceso no permitido" });
  next();
}, express.static(path.resolve(__dirname, "../../storage")));
app.use("/fotos", requireAuth, express.static(path.resolve(__dirname, "../../storage/Fotos de Perfil")));

// -- Rutas ----------------------------------------------------
app.get("/api/ping", (_req, res) => res.json({ status: "ok", message: "Servidor HelpDesk activo ✅" }));

// Cache-Control: no-store en rutas sensibles de auth
app.use("/api/auth", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// -- Refresh token: renueva el JWT si aun es valido ---------------
app.post("/api/auth/refresh-token", (req, res) => {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    // Solo renovar los campos de identidad, sin campos de expiracion anteriores
    const nuevoToken = jwt.sign(
      { id_empleado: payload.id_empleado, id_rol: payload.id_rol },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, token: nuevoToken });
  } catch {
    res.status(401).json({ error: "Token invalido o expirado" });
  }
});

app.use("/api/categorias",  categoriasRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/tickets",     ticketsRoutes);
app.use("/api/solicitudes", solicitudesRoutes);

// -- Manuales (BD + disco) ------------------------------------------
// GET — lista todos
app.get("/api/manuales", requireAuth, async (_req, res) => {
  try {
    const rows = await Manual.getAll();
    res.json(rows.map(m => ({
      ...m,
      url: `/storage/Manuales/${encodeURIComponent(path.basename(m.ruta_pdf))}`,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — subir PDF + metadatos
app.post("/api/manuales", requireAuth, (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  uploadManual.single("archivo")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Error al subir archivo" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    const { nombre, descripcion, id_categoria } = req.body;
    if (!nombre?.trim()) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const idCat = parseInt(id_categoria, 10);
    if (isNaN(idCat) || idCat < 1) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }
    try {
      // Renombrar archivo temporal al nombre formateado
      const nombreFinal = nombreManual(nombre.trim());
      const base = nombreFinal.replace(/\.pdf$/i, "");
      let rutaFinal = path.join(MANUALES_DIR, nombreFinal);
      let n = 1;
      while (true) {
        try { await fs.promises.access(rutaFinal); rutaFinal = path.join(MANUALES_DIR, `${base}_${n++}.pdf`); }
        catch { break; }
      }
      await fs.promises.rename(req.file.path, rutaFinal);

      const id = await Manual.crear({
        nombre:       nombre.trim().slice(0, 150),
        descripcion:  descripcion?.trim() || null,
        ruta_pdf:     rutaFinal,
        id_categoria: idCat,
      });
      const rows = await Manual.getAll();
      const manual = rows.find(m => m.id_manual === id);
      res.status(201).json({ ok: true, manual: {
        ...manual,
        url: `/storage/Manuales/${encodeURIComponent(path.basename(rutaFinal))}`,
      }});
    } catch (e) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: e.message });
    }
  });
});

// PUT — editar metadatos
app.put("/api/manuales/:id", requireAuth, async (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  const { nombre, descripcion, id_categoria } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
  const idCat = parseInt(id_categoria, 10);
  if (isNaN(idCat) || idCat < 1) return res.status(400).json({ error: "La categoría es obligatoria" });
  try {
    const ok = await Manual.actualizar(id, { nombre: nombre.trim().slice(0,150), descripcion: descripcion?.trim()||null, id_categoria: idCat });
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE — eliminar PDF + registro BD
app.delete("/api/manuales/:id", requireAuth, async (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const ruta = await Manual.getRuta(id);
    if (!ruta) return res.status(404).json({ error: "Manual no encontrado" });
    const ok = await Manual.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    try { await fs.promises.unlink(safeResolvePath(MANUALES_DIR, path.basename(ruta))); } catch { /* ya no existe */ }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// -- 404 en rutas /api/ → siempre JSON, nunca HTML ------------------
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

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
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  iniciarWorkers(io);
});
