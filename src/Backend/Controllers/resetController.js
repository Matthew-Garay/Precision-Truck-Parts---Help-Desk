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
import Empleado from "../Models/Empleado.js";
import pool     from "../Config/db.js";
import { enviarCodigoRecuperacion } from "../Config/mailer.js";

const TTL          = 10 * 60 * 1000; // ms
const MAX_INTENTOS = 5;

// Crea la tabla si no existe — se ejecuta una sola vez al cargar el módulo
pool.query(`
  CREATE TABLE IF NOT EXISTS reset_tokens (
    email       VARCHAR(255) PRIMARY KEY,
    codigo_hash VARCHAR(255) NOT NULL,
    id_empleado INT          NOT NULL,
    expira_en   BIGINT       NOT NULL,
    intentos    TINYINT      NOT NULL DEFAULT 0,
    verificado  TINYINT(1)   NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).catch(err => console.error("[resetController] No se pudo crear tabla reset_tokens:", err.message));

// Limpia tokens expirados cada 30 minutos
const ivLimpiar = setInterval(() =>
  pool.query("DELETE FROM reset_tokens WHERE expira_en < ?", [Date.now()])
    .catch(() => {}),
  30 * 60 * 1000
);
if (ivLimpiar.unref) ivLimpiar.unref();

const normalizeEmail = (e) => String(e).trim().toLowerCase();

async function getToken(email) {
  const [[row]] = await pool.query("SELECT * FROM reset_tokens WHERE email = ? LIMIT 1", [email]);
  return row || null;
}

async function setToken(email, data) {
  await pool.query(
    `INSERT INTO reset_tokens (email, codigo_hash, id_empleado, expira_en, intentos, verificado)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       codigo_hash = VALUES(codigo_hash),
       id_empleado = VALUES(id_empleado),
       expira_en   = VALUES(expira_en),
       intentos    = VALUES(intentos),
       verificado  = VALUES(verificado)`,
    [email, data.codigoHash, data.id_empleado, data.expiraEn, data.intentos, data.verificado ? 1 : 0]
  );
}

async function deleteToken(email) {
  await pool.query("DELETE FROM reset_tokens WHERE email = ?", [email]);
}

async function incrementIntentos(email) {
  await pool.query("UPDATE reset_tokens SET intentos = intentos + 1 WHERE email = ?", [email]);
}

async function marcarVerificado(email) {
  await pool.query("UPDATE reset_tokens SET verificado = 1 WHERE email = ?", [email]);
}

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

    await setToken(email, {
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
  const entrada = await getToken(email);

  if (!entrada || Date.now() > entrada.expira_en) {
    await deleteToken(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    await deleteToken(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  const codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigo_hash);
  if (!codigoValido) {
    await incrementIntentos(email);
    return res.status(400).json({ error: "Código incorrecto" });
  }

  try {
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      await deleteToken(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }
  } catch {
    return res.status(500).json({ error: "Error al verificar la cuenta" });
  }

  await marcarVerificado(email);
  res.json({ ok: true });
};

// -- POST /api/auth/reset-password ----------------------------
export const resetPassword = async (req, res) => {
  const { email: emailRaw, codigo, password_nueva } = req.body;
  if (!emailRaw || !codigo || !password_nueva)
    return res.status(400).json({ error: "Datos incompletos" });
  if (password_nueva.length < 8)
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });

  const email   = normalizeEmail(emailRaw);
  const entrada = await getToken(email);

  if (!entrada || Date.now() > entrada.expira_en) {
    await deleteToken(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    await deleteToken(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  let codigoValido = entrada.verificado === 1;
  if (!codigoValido) {
    codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigo_hash);
    if (!codigoValido) {
      await incrementIntentos(email);
      return res.status(400).json({ error: "Código incorrecto" });
    }
  }

  try {
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      await deleteToken(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }

    const hash = await bcrypt.hash(password_nueva, 12);
    await Empleado.updatePerfil(entrada.id_empleado, { password: hash });
    await deleteToken(email);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al restablecer contraseña:", err.message);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};
