/**
 * resetController.js
 *
 * Controlador que implementa el flujo completo de recuperacion de contrasena
 * en tres pasos: solicitud del codigo, verificacion del codigo y restablecimiento.
 *
 * El estado de los tokens se guarda en un Map en memoria (no en base de datos)
 * para evitar writes frecuentes. Cada entrada contiene:
 *   - codigoHash   : hash bcrypt del codigo de 6 digitos generado
 *   - id_empleado  : id del empleado que solicito la recuperacion
 *   - expiraEn     : timestamp de expiracion (10 minutos desde la solicitud)
 *   - intentos     : contador de intentos fallidos (maximo 5)
 *   - verificado   : bandera que indica si el codigo ya fue verificado correctamente
 *
 * Funciones exportadas:
 *
 *   solicitarRecuperacion  POST /api/auth/recuperar
 *     Recibe un correo electronico, busca al empleado activo, genera un codigo
 *     aleatorio de 6 digitos con crypto.randomInt, lo hashea con bcrypt y lo
 *     guarda en el Map con TTL de 10 minutos. Llama al mailer para enviar el
 *     codigo al correo del empleado. Siempre responde con el mismo mensaje
 *     generico independientemente de si el correo existe o no, para no revelar
 *     informacion sobre los usuarios registrados.
 *
 *   verificarCodigo  POST /api/auth/verificar-codigo
 *     Recibe el correo y el codigo. Valida que la entrada no haya expirado ni
 *     superado el maximo de intentos. Compara el codigo con su hash usando bcrypt.
 *     Si es correcto marca la entrada como verificada. Re-verifica que el empleado
 *     siga activo al momento de la verificacion.
 *
 *   resetPassword  POST /api/auth/reset-password
 *     Recibe el correo, el codigo y la nueva contrasena. Acepta tanto el flujo
 *     donde el codigo ya fue verificado previamente (bandera verificado = true)
 *     como el flujo directo sin paso previo de verificacion. Vuelve a confirmar
 *     que el empleado este activo (puede haber sido desactivado durante la ventana
 *     de 10 minutos del token). Hashea la nueva contrasena con bcrypt (12 rounds)
 *     y la guarda en la base de datos. Elimina la entrada del Map al terminar.
 */
import bcrypt   from "bcryptjs";
import crypto   from "crypto";
import fs       from "fs";
import path     from "path";
import { fileURLToPath } from "url";
import Empleado from "../Models/Empleado.js";
import { enviarCodigoRecuperacion } from "../Config/mailer.js";

const TTL          = 10 * 60 * 1000;
const MAX_INTENTOS = 5;

// -- Persistencia de tokens en disco (sobrevive reinicios) -----
const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR  = path.join(__dirname, "../Workers");
const TOKENS_FILE  = path.join(TOKENS_DIR, "reset_tokens.json");

function cargarTokens() {
  try {
    const data = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
    const ahora = Date.now();
    // Filtrar expirados al cargar
    return new Map(
      Object.entries(data).filter(([, v]) => v.expiraEn > ahora)
    );
  } catch { return new Map(); }
}

function guardarTokens(map) {
  const tmp = TOKENS_FILE + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(map)), "utf8");
    fs.renameSync(tmp, TOKENS_FILE);
  } catch (err) {
    console.error("[resetTokens] Error al guardar:", err.message);
    try { fs.unlinkSync(tmp); } catch {}
  }
}

const tokens = cargarTokens();

// Limpia tokens expirados cada 30 minutos
const ivLimpiar = setInterval(() => {
  const ahora = Date.now();
  let changed = false;
  for (const [email, entry] of tokens) {
    if (ahora > entry.expiraEn) { tokens.delete(email); changed = true; }
  }
  if (changed) guardarTokens(tokens);
}, 30 * 60 * 1000);
if (ivLimpiar.unref) ivLimpiar.unref();

const normalizeEmail    = (e)     => String(e).trim().toLowerCase();
const getToken          = (email) => tokens.get(email) ?? null;
const setToken          = (email, data) => { tokens.set(email, data); guardarTokens(tokens); };
const deleteToken       = (email) => { tokens.delete(email); guardarTokens(tokens); };
const incrementIntentos = (email) => { const e = tokens.get(email); if (e) { e.intentos++; guardarTokens(tokens); } };
const marcarVerificado  = (email) => { const e = tokens.get(email); if (e) { e.verificado = true; guardarTokens(tokens); } };

// -- POST /api/auth/recuperar ---------------------------------
export const solicitarRecuperacion = async (req, res) => {
  const emailRaw = req.body?.email;
  if (!emailRaw) return res.status(400).json({ error: "El correo es requerido" });
  const email = normalizeEmail(emailRaw);

  try {
    const empleado = await Empleado.findByEmail(email);
    const OK_MSG = { ok: true, message: "Si el correo existe, recibirás un código en breve." };
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") return res.json(OK_MSG);

    const codigo     = String(crypto.randomInt(100000, 999999));
    const codigoHash = await bcrypt.hash(codigo, 10);

    setToken(email, {
      codigoHash,
      id_empleado: empleado.id_empleado,
      expiraEn:    Date.now() + TTL,
      intentos:    0,
      verificado:  false,
    });

    await enviarCodigoRecuperacion({
      to:     empleado.email,
      nombre: `${empleado.nombre} ${empleado.ap_paterno}`,
      codigo,
    });
    res.json(OK_MSG);
  } catch (err) {
    console.error("Error en recuperacion:", err);
    res.status(500).json({ error: "No se pudo enviar el correo. Verifica tu dirección o intenta más tarde." });
  }
};

// -- POST /api/auth/verificar-codigo ------------------------
export const verificarCodigo = async (req, res) => {
  const { email: emailRaw, codigo } = req.body;
  if (!emailRaw || !codigo)
    return res.status(400).json({ error: "Datos incompletos" });

  const email   = normalizeEmail(emailRaw);
  const entrada = getToken(email);

  if (!entrada || Date.now() > entrada.expiraEn) {
    deleteToken(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    deleteToken(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  const codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigoHash);
  if (!codigoValido) {
    incrementIntentos(email);
    return res.status(400).json({ error: "Código incorrecto" });
  }

  try {
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      deleteToken(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }
  } catch {
    return res.status(500).json({ error: "Error al verificar la cuenta" });
  }

  marcarVerificado(email);
  res.json({ ok: true });
};

// -- POST /api/auth/reset-password ----------------------------
export const resetPassword = async (req, res) => {
  const { email: emailRaw, codigo, password_nueva } = req.body;
  if (!emailRaw || !codigo || !password_nueva)
    return res.status(400).json({ error: "Datos incompletos" });

  // Misma política que el resto del sistema
  if (password_nueva.length < 8)
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  if (!/[A-Z]/.test(password_nueva))
    return res.status(400).json({ error: "La contraseña debe contener al menos una mayúscula" });
  if (!/[0-9]/.test(password_nueva))
    return res.status(400).json({ error: "La contraseña debe contener al menos un número" });
  if (!/[^A-Za-z0-9]/.test(password_nueva))
    return res.status(400).json({ error: "La contraseña debe contener al menos un carácter especial" });

  const email   = normalizeEmail(emailRaw);
  const entrada = getToken(email);

  if (!entrada || Date.now() > entrada.expiraEn) {
    deleteToken(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    deleteToken(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  let codigoValido = entrada.verificado === true;
  if (!codigoValido) {
    codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigoHash);
    if (!codigoValido) {
      incrementIntentos(email);
      return res.status(400).json({ error: "Código incorrecto" });
    }
  }

  try {
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      deleteToken(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }

    const hash = await bcrypt.hash(password_nueva, 12);
    await Empleado.updatePerfil(entrada.id_empleado, { password: hash });
    deleteToken(email);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al restablecer contraseña:", err.message);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};
