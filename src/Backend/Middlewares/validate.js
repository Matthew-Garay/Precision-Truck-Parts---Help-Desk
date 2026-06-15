import { z } from "zod";

/**
 * Middleware factory: valida req.body contra un schema Zod.
 * Si falla devuelve 422 con los errores detallados.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const errores = (result.error?.errors ?? []).map(e => ({
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
  password_nueva:  z.string().min(8, "Mínimo 8 caracteres").optional(),
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
  password:        z.string().min(8, "Mínimo 8 caracteres"),
  id_rol:          z.number({ coerce: true }).int().positive(),
  id_departamento: z.number({ coerce: true }).int().positive(),
});

export const schemaUpdateEmpleadoAdmin = z.object({
  num_empleado:    z.string().trim().min(1).max(20).optional(),
  nombre:          z.string().trim().min(1).max(80).optional(),
  ap_paterno:      z.string().trim().min(1).max(80).optional(),
  ap_materno:      z.string().trim().max(80).optional(),
  email:           z.string().trim().email().optional(),
  id_rol:          z.number({ coerce: true }).int().positive().optional(),
  id_departamento: z.number({ coerce: true }).int().positive().optional(),
  estatus:         z.enum(["Activo", "Inactivo"]).optional(),
  password_nueva:  z.string().min(8).optional(),
});

export const schemaCrearTicket = z.object({
  titulo:       z.string().trim().min(1, "El título es requerido").max(200),
  descripcion:  z.string().trim().min(1, "La descripción es requerida").max(5000, "La descripción no puede superar 5000 caracteres"),
  prioridad:    z.enum(["Urgente", "Alta", "Media", "Bajo"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
});

export const schemaActualizarTicket = z.object({
  estatus:         z.enum(["En proceso", "Resuelto", "No Resuelto"]),
  comentarios:     z.string().max(10000).nullable().optional(),
  id_resuelto_por: z.number({ coerce: true }).int().positive().nullable().optional(),
});

export const schemaCalificarTicket = z.object({
  calificacion: z.number({ coerce: true }).int().min(1).max(5),
});

export const schemaEditarTicket = z.object({
  titulo:       z.string().trim().min(1).max(200),
  descripcion:  z.string().trim().min(1).max(5000, "La descripción no puede superar 5000 caracteres"),
  prioridad:    z.enum(["Urgente", "Alta", "Media", "Bajo"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
  estatus:      z.enum(["En proceso", "Resuelto", "No Resuelto"]).optional(),
  comentarios:  z.string().max(10000).nullable().optional(),
});

export const schemaCrearSolicitud = z.object({
  prioridad:   z.enum(["Urgente", "Alta", "Media", "Baja"]),
  // id_empleado del body solo es referencial; el controller valida ownership contra el JWT
  id_empleado: z.number({ coerce: true }).int().positive(),
  insumos:     z.array(z.object({
    id_insumo: z.number({ coerce: true }).int().positive(),
    cantidad:  z.number({ coerce: true }).int().min(1, "La cantidad debe ser al menos 1"),
  })).min(1, "Debe incluir al menos un insumo").max(50, "Máximo 50 insumos por solicitud"),
});

export const schemaActualizarEstatusSolicitud = z.object({
  estatus: z.enum(["En proceso", "Resuelto", "No Resuelto"]),
});

export const schemaInsumo = z.object({
  num_serie:    z.string().trim().max(100).optional().default(""),
  nombre:       z.string().trim().min(1, "Nombre requerido").max(150),
  marca:        z.string().trim().max(80).optional().default(""),
  modelo:       z.string().trim().max(80).optional().default(""),
  stock:        z.number({ coerce: true }).int().min(0),
  estado:       z.enum(["Excelente", "Bueno", "Regular", "Malo"]),
  id_categoria: z.number({ coerce: true }).int().positive(),
});
