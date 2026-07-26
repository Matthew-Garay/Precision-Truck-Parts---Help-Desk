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
 * Esquemas exportados:
 *
 *   schemaLogin
 *     Valida email con formato correcto y password no vacio.
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
 *     (enum: Excelente, Bueno, Regular, Malo) y stock como entero >= 0.
 */
import { z } from "zod";

/**
 * Middleware factory: valida req.body contra un schema Zod.
 * Si falla devuelve 422 con los errores detallados.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
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

export const schemaLogin = z.object({
  email:    z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const schemaLogout = z.object({
  id_acceso: z.number({ coerce: true }).int().positive(),
});

export const schemaActualizarPerfil = z.object({
  nombre:          z.string().trim().min(1).max(80).optional(),
  ap_paterno:      z.string().trim().min(1).max(80).optional(),
  ap_materno:      z.string().trim().max(80).optional(),
  email:           z.string().trim().email().optional(),
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
  email:           z.string().trim().email(),
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
  email:           z.string().trim().email().optional(),
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
});

export const schemaActualizarEstatusSolicitud = z.object({
  estatus: z.enum(["En proceso", "Aceptado", "Rechazado"]),
  items: z.array(z.object({
    id_solicitud_insumo: z.number({ coerce: true }).int().positive(),
    aprobado: z.union([z.literal(0), z.literal(1)]),
  })).optional(),
}).refine(
  (d) => d.estatus !== "Aceptado" || (Array.isArray(d.items) && d.items.length > 0),
  { message: "Debes indicar el estado de aprobación de cada ítem al aceptar", path: ["items"] }
);

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

export const schemaInsumo = z.object({
  num_serie:    z.string().trim().max(100).optional().default(""),
  nombre:       z.string().trim().min(1, "Nombre requerido").max(150),
  descripcion:  z.string().trim().max(1000).optional().nullable().default(null),
  marca:        z.string().trim().max(100).optional().default(""),
  modelo:       z.string().trim().max(100).optional().default(""),
  stock:        z.number({ coerce: true }).int().min(0),
  estado:       z.enum(["Excelente", "Bueno", "Regular", "Malo"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
  proveedor:    z.string().trim().max(255).optional().nullable().default(null),
  imagen_url:   z.string().trim().max(255).optional().nullable().default(null),
});
