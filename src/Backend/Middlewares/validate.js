/**
 * validate.js
 *
 * Define la fabrica de middlewares de validacion basada en esquemas Zod
 * y exporta todos los esquemas de validacion usados en el sistema.
 *
 * validate(schema)
 *   Retorna un middleware de Express que aplica schema.safeParse al cuerpo
 *   de la peticion (req.body). Si la validacion falla retorna 422 Unprocessable
 *   Entity con la lista de errores indicando el campo afectado y el mensaje.
 *   Si la validacion pasa reemplaza req.body con los datos normalizados por Zod
 *   (valores coercionados, strings recortados, opcionales con defaults aplicados)
 *   para que el controlador reciba datos siempre limpios y del tipo correcto.
 *
 * Política de correo corporativo:
 *
 *   Todo correo del sistema debe pertenecer exactamente a uno de los
 *   dominios de DOMINIOS_PERMITIDOS (refividrio.com.mx, ptp.com.mx,
 *   megapartes.com.mx, ebatruck.com.mx). La validación tiene dos capas:
 *   zEmailCorporativo (esquema Zod aplicado por validate() en las rutas)
 *   y validarEmailCorporativo (helper plano que los controllers usan como
 *   defensa en profundidad, incluyendo rutas sin middleware validate).
 *
 * Esquemas exportados:
 *
 *   schemaLogin
 *     Valida email corporativo (dominio permitido) y password no vacio.
 *
 *   schemaLogout
 *     Valida que id_acceso sea un entero positivo.
 *
 *   schemaActualizarPerfil
 *     Valida campos opcionales del perfil del empleado. Aplica refinement
 *     para exigir password_actual cuando se envia password_nueva.
 *
 *   schemaCrearEmpleado
 *     Valida todos los campos obligatorios del nuevo empleado incluyendo
 *     minimo 8 caracteres para la contrasena.
 *
 *   schemaUpdateEmpleadoAdmin
 *     Igual que schemaCrearEmpleado pero todos los campos son opcionales
 *     ya que el admin puede actualizar solo algunos campos.
 *
 *   schemaCrearTicket
 *     Valida titulo (max 200), descripcion (max 5000), prioridad (enum)
 *     y id_categoria (entero positivo).
 *
 *   schemaActualizarTicket
 *     Valida estatus (enum: En proceso, Resuelto, No Resuelto), comentarios
 *     opcionales y id del tecnico que resuelve.
 *
 *   schemaCalificarTicket
 *     Valida calificacion como entero entre 1 y 5.
 *
 *   schemaEditarTicket
 *     Combina campos de creacion con estatus y comentarios opcionales.
 *
 *   schemaCrearSolicitud
 *     Valida prioridad, id_empleado y el arreglo de insumos (minimo 1,
 *     maximo 50 items, cada uno con id_insumo y cantidad >= 1).
 *
 *   schemaActualizarEstatusSolicitud
 *     Valida que el estatus sea uno de los tres valores permitidos.
 *
 *   schemaInsumo
 *     Valida todos los campos de un insumo del inventario incluyendo estado
 *     (enum: Excelente, Bueno, Regular, Malo, Dañado) y stock como entero >= 0.
 *     Los campos de texto opcionales (num_serie, descripcion, marca, modelo)
 *     que se dejen en blanco se guardan automaticamente como "N/A".
 */
import { z } from "zod";

/**
 * Middleware factory: valida req.body contra un schema Zod.
 * Si falla devuelve 422 con los errores detallados.
 *
 * ANTES de validar se limpian los strings vacíos ("" -> null) de forma
 * recursiva. Esto era la CAUSA RAÍZ del "Datos inválidos" que el modal de
 * salidas devolvía siempre: un <select>/<input> sin elegir manda "" y
 * Zod lo trataba como un número 0 o como una fecha con formato inválido,
 * rechazando toda la petición aunque el resto del payload estuviera bien.
 */
const vaciosANull = (v) => {
  if (v === "") return null;
  if (Array.isArray(v)) return v.map(vaciosANull);
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = {};
    for (const k of Object.keys(v)) o[k] = vaciosANull(v[k]);
    return o;
  }
  return v;
};

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(vaciosANull(req.body ?? {}));
    if (!result.success) {
      const errores = (result.error?.issues ?? []).map(e => ({
        campo:   e.path.join("."),
        mensaje: e.message,
      }));
      return res.status(422).json({ error: "Datos inválidos", errores });
    }
    req.body = result.data;
    next();
  };
}

// -- SCHEMAS --------------------------------------------------

// Política de contraseña corporativa: mín 8 chars, 1 mayúscula, 1 número, 1 símbolo
const passwordPolicy = z.string()
  .min(8, "Mínimo 8 caracteres")
  .refine(p => /[A-Z]/.test(p), "Debe contener al menos una mayúscula")
  .refine(p => /[0-9]/.test(p), "Debe contener al menos un número")
  .refine(p => /[^A-Za-z0-9]/.test(p), "Debe contener al menos un carácter especial");

// ── Política de correo corporativo ─────────────────────────────────
// Lista blanca de dominios: solo se aceptan correos corporativos cuyo
// dominio coincida EXACTAMENTE. Se rechazan subdominios (mail.ptp.com.mx),
// dominios truqueros (ptp.com.mx.evil.com, x-ebatruck.com.mx), variantes
// de mayúsculas y homógrafos Unicode (ej. "рtp.com.mx" con letra cirílica).
export const DOMINIOS_PERMITIDOS = Object.freeze([
  "refividrio.com.mx",
  "ptp.com.mx",
  "megapartes.com.mx",
  "ebatruck.com.mx",
]);

// Parte local en formato dot-atom RFC 5322: un solo punto entre átomos
// (sin puntos al inicio/fin ni puntos consecutivos).
const RE_LOCAL_CORREO = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
// Etiqueta de dominio RFC 1123 en minúsculas (letras/dígitos/guion interno).
const RE_ETIQUETA_DOMINIO = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Texto estándar que lista los dominios aceptados. */
export function mensajeDominiosPermitidos() {
  return `Dominio no permitido. Usa un correo corporativo de: ${DOMINIOS_PERMITIDOS.map(d => "@" + d).join(", ")}`;
}

/**
 * validarEmailCorporativo(valor)
 *
 * Valida un correo contra la política corporativa. Retorna null si es
 * válido o un mensaje de error legible si no lo es. Comprobaciones:
 *
 *   1. Que sea un string no vacío (el correo es obligatorio).
 *   2. Longitud total <= 254 caracteres (límite RFC 5321).
 *   3. Solo ASCII imprimible: bloquea caracteres de control, espacios
 *      ocultos y homógrafos Unicode (ataques de homografía/IDN).
 *   4. Sin espacios internos.
 *   5. Exactamente un "@" con parte local y dominio presentes.
 *   6. Parte local <= 64 caracteres y en formato dot-atom (RFC 5322).
 *   7. Dominio <= 253 caracteres, etiquetas válidas y sin punto final.
 *   8. Dominio presente en DOMINIOS_PERMITIDOS por igualdad exacta
 *      tras normalizar a minúsculas (sin subdominios ni dominios parecidos).
 */
export function validarEmailCorporativo(valor) {
  if (valor === undefined || valor === null) return "El correo es requerido";
  if (typeof valor !== "string")             return "El correo debe ser una cadena de texto";

  const email = valor.trim();
  if (!email)                         return "El correo es requerido";
  if (email.length > 254)             return "El correo no puede superar 254 caracteres";
  if (!/^[\x20-\x7E]+$/.test(email))  return "El correo contiene caracteres no válidos";
  if (/\s/.test(email))               return "El correo no puede contener espacios";

  const pos = email.indexOf("@");
  if (pos < 1 || pos !== email.lastIndexOf("@")) return "Formato de correo inválido";

  const local   = email.slice(0, pos);
  const dominio = email.slice(pos + 1).toLowerCase();

  if (local.length > 64)                 return "La parte local del correo supera los 64 caracteres";
  if (!RE_LOCAL_CORREO.test(local))      return "Formato de correo inválido";
  if (dominio.length > 253)              return "El dominio del correo supera los 253 caracteres";

  const etiquetas = dominio.split(".");
  if (etiquetas.length < 2 || etiquetas.some(e => !RE_ETIQUETA_DOMINIO.test(e)))
    return "Formato de dominio inválido";

  if (!DOMINIOS_PERMITIDOS.includes(dominio)) return mensajeDominiosPermitidos();
  return null;
}

/**
 * zEmailCorporativo
 *   Esquema Zod reutilizable para el campo email. Recorta espacios y aplica
 *   la política de dominios con un mensaje específico para cada rechazo.
 */
export const zEmailCorporativo = z.string({ error: "El correo es requerido" })
  .trim()
  .superRefine((valor, ctx) => {
    const error = validarEmailCorporativo(valor);
    if (error) ctx.addIssue({ code: "custom", message: error });
  });

export const schemaLogin = z.object({
  email:    zEmailCorporativo,
  password: z.string().min(1, "La contraseña es requerida"),
});

export const schemaLogout = z.object({
  id_acceso: z.number({ coerce: true }).int().positive(),
});

export const schemaActualizarPerfil = z.object({
  nombre:          z.string().trim().min(1).max(80).optional(),
  ap_paterno:      z.string().trim().min(1).max(80).optional(),
  ap_materno:      z.string().trim().max(80).optional(),
  email:           zEmailCorporativo.optional(),
  password_actual: z.string().min(1).optional(),
  password_nueva:  passwordPolicy.optional(),
}).refine(
  (d) => !d.password_nueva || !!d.password_actual,
  { message: "La contraseña actual es requerida para cambiarla", path: ["password_actual"] }
);

export const schemaCrearEmpleado = z.object({
  num_empleado:    z.string().trim().min(1).max(20),
  nombre:          z.string().trim().min(1).max(80),
  ap_paterno:      z.string().trim().min(1).max(80),
  ap_materno:      z.string().trim().max(80).optional().default(""),
  email:           zEmailCorporativo,
  password:        passwordPolicy,
  id_rol:          z.number({ coerce: true }).int().positive(),
  id_departamento: z.number({ coerce: true }).int().positive(),
  id_sucursal:     z.number({ coerce: true }).int().positive().nullable().optional(),
});

export const schemaUpdateEmpleadoAdmin = z.object({
  num_empleado:    z.string().trim().min(1).max(20).optional(),
  nombre:          z.string().trim().min(1).max(80).optional(),
  ap_paterno:      z.string().trim().min(1).max(80).optional(),
  ap_materno:      z.string().trim().max(80).optional(),
  email:           zEmailCorporativo.optional(),
  id_rol:          z.number({ coerce: true }).int().positive().optional(),
  id_departamento: z.number({ coerce: true }).int().positive().optional(),
  id_sucursal:     z.union([z.number({ coerce: true }).int().positive(), z.literal(""), z.null()]).transform(v => (v === "" || v === null) ? null : Number(v)).optional(),
  estatus:         z.enum(["Activo", "Inactivo"]).optional(),
  password_nueva:  passwordPolicy.optional(),
});

export const schemaCrearTicket = z.object({
  titulo:       z.string().trim().min(1, "El título es requerido").max(200),
  descripcion:  z.string().trim().min(1, "La descripción es requerida").max(5000, "La descripción no puede superar 5000 caracteres"),
  prioridad:    z.enum(["Urgente", "Alta", "Media", "Baja"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
});

export const schemaActualizarTicket = z.object({
  // "Cancelado" se incluye aquí aunque la ruta PATCH /:id_ticket solo
  // lo usa el admin. La ruta /cancelar tiene su propio endpoint.
  estatus:         z.enum(["En proceso", "Resuelto", "No Resuelto", "Cancelado"]),
  comentarios:     z.string().max(10000).nullable().optional(),
  id_resuelto_por: z.number({ coerce: true }).int().positive().nullable().optional(),
});

export const schemaCalificarTicket = z.object({
  calificacion: z.number({ coerce: true }).int().min(1).max(5),
});

export const schemaEditarTicket = z.object({
  titulo:       z.string().trim().min(1).max(200),
  descripcion:  z.string().trim().min(1).max(5000, "La descripción no puede superar 5000 caracteres"),
  prioridad:    z.enum(["Urgente", "Alta", "Media", "Baja"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
  estatus:      z.enum(["En proceso", "Resuelto", "No Resuelto", "Cancelado"]).optional(),
  comentarios:  z.string().max(10000).nullable().optional(),
});

export const schemaCrearSolicitud = z.object({
  prioridad:   z.enum(["Urgente", "Alta", "Media", "Baja"]),
  // id_empleado del body solo es referencial; el controller valida ownership contra el JWT
  id_empleado: z.number({ coerce: true }).int().positive(),
  insumos:     z.array(z.object({
    id_insumo:   z.number({ coerce: true }).int().positive(),
    cantidad:    z.number({ coerce: true }).int().min(1, "La cantidad debe ser al menos 1"),
    descripcion: z.string().trim().max(1000).optional().nullable().default(null),
  })).min(1, "Debe incluir al menos un insumo").max(50, "Máximo 50 insumos por solicitud"),
  // Justificación general de la solicitud (la escribe el empleado en el formulario).
  // OBLIGATORIA: sin ella el backend rechaza la solicitud. Antes era .nullish()
  // y una justificacion vacia se colaba hasta el controller, que devolvia un
  // 400 "La justificacion es requerida" aunque el usuario ya la habia escrito.
  // Zod v4: el mensaje unico se pasa con `error` (required_error ya no existe).
  descripcion: z.string({ error: "La justificación es requerida" })
                 .trim()
                 .min(1, "La justificación es requerida")
                 .max(2000, "La justificación no puede superar los 2000 caracteres"),
});

export const schemaActualizarEstatusSolicitud = z.object({
  estatus: z.enum(["En proceso", "Aceptado", "Rechazado"]),
  // Ruta del material que elige el admin (obligatoria al aceptar).
  id_sucursal_origen:  z.number({ coerce: true }).int().positive().nullish(),
  id_sucursal_destino: z.number({ coerce: true }).int().positive().nullish(),
  items: z.array(z.object({
    id_solicitud_insumo: z.number({ coerce: true }).int().positive(),
    aprobado: z.union([z.literal(0), z.literal(1)]),
    // Cantidad que el admin acepta entregar. Ojo: sin esta clave Zod la
    // eliminaba del body y el cambio de cantidad nunca llegaba al servidor.
    cantidad: z.number({ coerce: true }).int().min(0).nullish(),
  })).optional(),
}).refine(
  (d) => d.estatus !== "Aceptado" || (Array.isArray(d.items) && d.items.length > 0),
  { message: "Debes indicar el estado de aprobación de cada ítem al aceptar", path: ["items"] }
).refine(
  (d) => d.estatus !== "Aceptado" || (!!d.id_sucursal_origen && !!d.id_sucursal_destino),
  { message: "Debes elegir la sucursal de origen y la de destino antes de aceptar", path: ["id_sucursal_origen"] }
);

// Schema para registrar una ENTRADA de material al inventario.
// La entrada NO lleva ruta de sucursales: la ruta del material la define el
// administrador sobre la SOLICITUD (PATCH /:id/ruta), no al capturar la
// entrada. Solo se suman piezas y se deja el motivo de referencia.
export const schemaEntradaInsumo = z.object({
  cantidad:     z.number({ coerce: true }).int().min(1, "La cantidad debe ser al menos 1").max(100000),
  motivo:       z.string().trim().max(500).optional().nullable().default(null),
  id_solicitud: z.number({ coerce: true }).int().positive().nullish(),
});

// Schema para registrar una SALIDA INTERNA manual de insumos (uso interno).
// Descuenta stock en transacción y deja el movimiento con el folio SAL-XXXX
// en el motivo. Los campos libres (destino, responsable, etc.) viajan dentro
// del motivo estructurado, sin migración de BD.
// TODO EL FORMATO ES EDITABLE: el usuario llena fecha, solicitante, destino,
// responsable y motivo. La fecha NO se toma del servidor: es la fecha que el
// usuario escribe en la hoja de salida (fecha real del movimiento físico).
// Acepta UNA salida (id_insumo + cantidad) o VARIAS (items[]); el controller
// normaliza ambos formatos al mismo flujo multi-renglón.
export const schemaSalidaInsumo = z.object({
  id_insumo: z.number({ coerce: true }).int().positive().nullish(),
  cantidad:  z.number({ coerce: true }).int().min(1, "La cantidad debe ser al menos 1").max(100000).nullish(),
  items: z.array(z.object({
    id_insumo: z.number({ coerce: true }).int().positive(),
    cantidad:  z.number({ coerce: true }).int().min(1, "La cantidad debe ser al menos 1").max(100000),
  })).min(1, "Debe incluir al menos un insumo").max(100).nullish(),
  destino:     z.string().trim().max(200).optional().nullable().default(null),
  responsable: z.string().trim().max(200).optional().nullable().default(null),
  motivo:      z.string().trim().max(500).optional().nullable().default(null),
  // Fecha manual de la salida. Acepta SOLO fecha (YYYY-MM-DD) o fecha con
  // hora (YYYY-MM-DDTHH:MM o YYYY-MM-DD HH:MM) porque el formato nuevo
  // captura también la hora del movimiento físico.
  fecha: z.string().trim()
    .regex(/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/,
      "Fecha inválida (usa AAAA-MM-DD o AAAA-MM-DD HH:MM)")
    .refine((s) => {
      const d = new Date(s.replace(" ", "T").replace(/(T\d{2}:\d{2})$/, "$1:00"));
      return !Number.isNaN(d.getTime());
    }, "Fecha inválida")
    .optional().nullable().default(null),
  // Quien entrega / solicitante interno (texto libre, se imprime en la hoja).
  solicitante: z.string().trim().max(200).optional().nullable().default(null),
  // ── Formato nuevo ─────────────────────────────────────────────────
  // Ruta del material: sucursales de origen y destino (lo que antes era
  // un simple campo libre "destino").
  id_sucursal_origen:  z.number({ coerce: true }).int().positive().optional().nullable().default(null),
  // Justificación / motivo que escribe quien captura la salida.
  justificacion: z.string().trim().max(2000).optional().nullable().default(null),
  // Prioridad del movimiento (mismo catálogo que las solicitudes).
  prioridad: z.enum(["Urgente", "Alta", "Media", "Baja"]).optional().nullable().default(null),
  // Formato 100% editable con listas: cada campo también acepta el ID elegido
  // de su lista (empleados / sucursales). El controlador resuelve el ID a
  // nombre para guardarlo en el motivo estructurado. El texto libre se
  // conserva por compatibilidad con hojas viejas.
  id_destino:          z.number({ coerce: true }).int().positive().optional().nullable().default(null),
  id_sucursal_destino: z.number({ coerce: true }).int().positive().optional().nullable().default(null),
  id_responsable:      z.number({ coerce: true }).int().positive().optional().nullable().default(null),
  id_solicitante:      z.number({ coerce: true }).int().positive().optional().nullable().default(null),
}).refine(
  (d) => (Array.isArray(d.items) && d.items.length > 0) || (d.id_insumo && d.cantidad),
  { message: "Debe incluir al menos un insumo con su cantidad", path: ["items"] }
);
// Schema para guardar la RUTA DEL MATERIAL de una solicitud (Soporte o admin).
// Ambas sucursales son obligatorias y deben ser distintas.
export const schemaRutaSolicitud = z.object({
  id_sucursal_origen:  z.number({ coerce: true }).int().positive({ message: "Selecciona la sucursal de origen" }),
  id_sucursal_destino: z.number({ coerce: true }).int().positive({ message: "Selecciona la sucursal de destino" }),
}).refine(
  (d) => d.id_sucursal_origen !== d.id_sucursal_destino,
  { message: "La sucursal de origen y la de destino deben ser distintas", path: ["id_sucursal_destino"] }
);

// Schema para "Guardar seleccion" de una solicitud abierta (PATCH /:id/items)
export const schemaItemsSolicitud = z.object({
  items: z.array(z.object({
    id_solicitud_insumo: z.number({ coerce: true }).int().positive(),
    aprobado: z.union([z.literal(0), z.literal(1)]),
    cantidad: z.number({ coerce: true }).int().min(0).nullish(),
  })).min(1, "Debe incluir al menos un ítem").max(100),
  id_sucursal_origen:  z.number({ coerce: true }).int().positive().nullish(),
  id_sucursal_destino: z.number({ coerce: true }).int().positive().nullish(),
});


/**
 * Observacion de Soporte Tecnico o Administracion sobre un insumo pedido.
 * Se admite cadena vacia: eso borra la observacion existente (y su autor).
 */
export const schemaObservacionItem = z.object({
  observaciones: z
    .string()
    .trim()
    .max(500, "La observacion no puede superar 500 caracteres")
    .default(""),
});


// Schema para filtros de búsqueda en tickets (#16)
export const schemaFiltrosTickets = z.object({
  page:       z.number({ coerce: true }).int().positive().optional().default(1),
  limit:      z.number({ coerce: true }).int().positive().max(2000).optional().default(50),
  estatus:    z.enum(["En proceso", "Resuelto", "No Resuelto", "Cancelado"]).optional(),
  prioridad:  z.enum(["Urgente", "Alta", "Media", "Baja"]).optional(),
  q:          z.string().trim().max(200).optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD").optional(),
  fecha_fin:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD").optional(),
  tecnico:    z.string().trim().max(200).optional(),
  usuario:    z.string().trim().max(200).optional(),
  area:       z.string().trim().max(200).optional(),
  sucursal:   z.string().trim().max(200).optional(),
});

/**
 * Texto opcional de insumo que, si se deja en blanco (vacío, solo espacios
 * o null), se guarda automáticamente como "N/A" para que el registro nunca
 * quede vacío en el inventario (misma convención que ya usan los datos
 * sembrados de la tabla insumo).
 *
 * NOTA: imagen_url NO usa este transform — la foto necesita quedarse en null
 * para que el frontend sepa que el insumo aún no tiene imagen.
 */
const textoNA = (max) =>
  z.string().trim().max(max)
    .nullable()
    .optional()
    .transform(v => (v ? v : "N/A"))
    .default("N/A");

export const schemaInsumo = z.object({
  num_serie:    textoNA(100),
  nombre:       z.string().trim().min(1, "Nombre requerido").max(150),
  descripcion:  textoNA(1000),
  marca:        textoNA(100),
  modelo:       textoNA(100),
  stock:        z.number({ coerce: true }).int().min(0),
  estado:       z.enum(["Excelente", "Bueno", "Regular", "Malo", "Dañado"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
  imagen_url:   z.string().trim().max(255).optional().nullable().default(null),
});
