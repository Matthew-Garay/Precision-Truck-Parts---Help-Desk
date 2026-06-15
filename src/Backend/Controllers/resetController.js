import bcrypt   from "bcryptjs";
import crypto   from "crypto";
import Empleado from "../Models/Empleado.js";
import { enviarCodigoRecuperacion } from "../Config/mailer.js";

const TTL          = 10 * 60 * 1000; // ms
const MAX_INTENTOS = 5;

// Almacén en memoria: email -> { codigoHash, id_empleado, expiraEn, intentos, verificado }
const tokens = new Map();

const normalizeEmail = (e) => String(e).trim().toLowerCase();

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

    tokens.set(email, {
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
  const entrada = tokens.get(email);

  if (!entrada || Date.now() > entrada.expiraEn) {
    tokens.delete(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    tokens.delete(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  const codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigoHash);
  if (!codigoValido) {
    entrada.intentos++;
    return res.status(400).json({ error: "Código incorrecto" });
  }

  // Verificar que el empleado siga activo antes de marcar el token como válido
  try {
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      tokens.delete(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }
  } catch {
    return res.status(500).json({ error: "Error al verificar la cuenta" });
  }

  entrada.verificado = true;
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
  const entrada = tokens.get(email);

  if (!entrada || Date.now() > entrada.expiraEn) {
    tokens.delete(email);
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  }

  if (entrada.intentos >= MAX_INTENTOS) {
    tokens.delete(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }

  let codigoValido = entrada.verificado;
  if (!codigoValido) {
    codigoValido = await bcrypt.compare(String(codigo).trim(), entrada.codigoHash);
    if (!codigoValido) {
      entrada.intentos++;
      return res.status(400).json({ error: "Código incorrecto" });
    }
  }

  try {
    // Re-verificar que el empleado siga activo al momento del reset,
    // no solo al momento de solicitar el código (puede haber sido desactivado
    // durante la ventana de 10 minutos del token).
    const empleado = await Empleado.findById(entrada.id_empleado);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo") {
      tokens.delete(email);
      return res.status(403).json({ error: "Tu cuenta no está activa. Contacta al administrador." });
    }

    const hash = await bcrypt.hash(password_nueva, 12);
    await Empleado.updatePerfil(entrada.id_empleado, { password: hash });
    tokens.delete(email);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al restablecer contraseña:", err.message);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};
