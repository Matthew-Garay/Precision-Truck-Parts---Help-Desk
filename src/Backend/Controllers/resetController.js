import bcrypt   from "bcryptjs";
import crypto   from "crypto";
import Empleado from "../Models/Empleado.js";
import { enviarCodigoRecuperacion } from "../Config/mailer.js";

// -- Store en memoria: email → { codigo, expira, id_empleado } -
// NOTA: Al ser un Map en memoria, los códigos se pierden si el servidor
// se reinicia. Esto es aceptable - el usuario simplemente solicita un
// nuevo código. No se usa BD intencionalmente para evitar migraciones.
const store = new Map();
const TTL   = 15 * 60 * 1000;
const MAX_INTENTOS = 5;

setInterval(() => {
  const ahora = Date.now();
  for (const [key, val] of store)
    if (val.expira < ahora) store.delete(key);
}, 5 * 60 * 1000);

// -- POST /api/auth/recuperar ---------------------------------
export const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "El correo es requerido" });
  try {
    const empleado = await Empleado.findByEmail(email);
    if (!empleado || empleado.estatus?.toLowerCase() !== "activo")
      return res.json({ ok: true }); // respuesta generica - no revelar si existe

    const codigo = String(crypto.randomInt(100000, 999999));
    store.set(email, { codigo, id_empleado: empleado.id_empleado, expira: Date.now() + TTL, intentos: 0 });

    await enviarCodigoRecuperacion({
      to:     empleado.email,
      nombre: `${empleado.nombre} ${empleado.ap_paterno}`,
      codigo,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error en recuperacion:", err.message);
    res.status(500).json({ error: "No se pudo enviar el correo. Verifica tu direccion o intenta mas tarde." });
  }
};

// -- POST /api/auth/reset-password ----------------------------
export const resetPassword = async (req, res) => {
  const { email, codigo, password_nueva } = req.body;
  if (!email || !codigo || !password_nueva)
    return res.status(400).json({ error: "Datos incompletos" });
  if (password_nueva.length < 6)
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

  const entrada = store.get(email);
  if (!entrada || entrada.expira < Date.now())
    return res.status(400).json({ error: "El código expiró. Solicita uno nuevo." });
  if (entrada.intentos >= MAX_INTENTOS) {
    store.delete(email);
    return res.status(400).json({ error: "Demasiados intentos fallidos. Solicita un nuevo código." });
  }
  if (entrada.codigo !== String(codigo).trim()) {
    entrada.intentos++;
    return res.status(400).json({ error: "Código incorrecto" });
  }

  try {
    const hash = await bcrypt.hash(password_nueva, 10);
    await Empleado.updatePerfil(entrada.id_empleado, { password: hash });
    store.delete(email);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al restablecer la contraseña", detalle: err.message });
  }
};
