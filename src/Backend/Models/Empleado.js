/**
 * Empleado.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla `empleado`
 * y su historial de accesos en la tabla `historial_acceso`.
 *
 * Metodos:
 *
 *   findByEmail(email)
 *     Busca un empleado por correo electronico. Incluye el nombre de su
 *     departamento con JOIN. Retorna null si no existe.
 *     Usado en el proceso de login y recuperacion de contrasena.
 *
 *   findById(id)
 *     Busca un empleado por su id primario. Incluye departamento.
 *     Retorna null si no existe. Incluye el campo password para poder
 *     compararlo en el proceso de cambio de contrasena.
 *
 *   updatePerfil(id, campos)
 *     Actualiza nombre, apellidos, email, password y foto del empleado.
 *     Usa COALESCE en el SQL para que solo se sobreescriban los campos
 *     que se pasen con valor distinto de null o undefined.
 *     El SQL es completamente estatico, sin construccion dinamica de columnas.
 *
 *   updateAdmin(id, campos)
 *     Igual que updatePerfil pero permite ademas cambiar num_empleado,
 *     id_rol, id_departamento y estatus. Solo lo llama el controlador admin.
 *
 *   crear(campos)
 *     Inserta un nuevo empleado con estatus "Activo" por defecto.
 *     Retorna el insertId del nuevo registro.
 *
 *   getAll()
 *     Retorna todos los empleados con nombre de departamento y nombre de rol.
 *     Nunca incluye el campo password en la consulta.
 *
 *   getResumen(id_empleado)
 *     Helper que retorna nombre completo y departamento concatenados en un
 *     solo objeto. Se usa en los controladores para enriquecer los eventos
 *     de Socket.io sin necesidad de una consulta completa del empleado.
 *
 *   getNombre(id_empleado)
 *     Helper que retorna solo el nombre completo de un empleado. Se usa
 *     en los eventos de "ticket en atencion" para incluir el nombre del tecnico.
 *
 *   getDepartamentos()
 *     Retorna el catalogo de departamentos ordenado alfabeticamente.
 *
 *   getRoles()
 *     Retorna el catalogo de roles ordenado por id.
 *
 *   cerrarSesionesHuerfanas(id_empleado)
 *     Cierra todos los registros del historial de accesos del empleado que
 *     no tienen fecha de salida. Se llama justo antes de registrar un nuevo
 *     login para mantener el historial consistente.
 *
 *   registrarEntrada(id_empleado)
 *     Inserta un nuevo registro en historial_acceso y retorna su id (id_acceso).
 *     El id_acceso se envia al frontend para usarlo al hacer logout.
 *
 *   registrarSalida(id_acceso)
 *     Actualiza la fecha de salida del registro de historial indicado.
 *
 *   getAccesos(id_empleado, { limit, offset })
 *     Retorna el historial de accesos paginado de un empleado especifico,
 *     junto con el total de registros para calcular la paginacion.
 *
 *   getAllAccesos({ limit, offset })
 *     Retorna el historial de accesos de todos los empleados paginado.
 *     Incluye nombre completo, email y departamento de cada empleado.
 */
import pool from "../Config/db.js";
import { cache } from "../Config/cache.js";

const TTL_CATALOGO = 10 * 60 * 1000; // 10 minutos — catálogos casi estáticos
const TTL_NOMBRE   =  5 * 60 * 1000; // 5 minutos
const TTL_EMPLEADOS = 2 * 60 * 1000; // 2 minutos

const Empleado = {
  findByEmail: async (email) => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.password, e.foto, e.estatus, e.id_rol, e.id_departamento,
              e.id_sucursal, d.nombre_departamento, s.nombre_sucursal
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN sucursal s     ON e.id_sucursal     = s.id_sucursal
       WHERE e.email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  // findById SIN password — para uso general (controladores, respuestas API)
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.foto, e.estatus, e.id_rol, e.id_departamento,
              e.id_sucursal, d.nombre_departamento, s.nombre_sucursal
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN sucursal s     ON e.id_sucursal     = s.id_sucursal
       WHERE e.id_empleado = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // findByIdConPassword — solo para verificar contraseña actual (cambio de clave)
  findByIdConPassword: async (id) => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.password, e.estatus
       FROM empleado e WHERE e.id_empleado = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  updatePerfil: async (id, { nombre, ap_paterno, ap_materno, email, password, foto }) => {
    // SQL estático - sin construcción dinámica de nombres de columna
    await pool.query(
      `UPDATE empleado
       SET nombre     = COALESCE(?, nombre),
           ap_paterno = COALESCE(?, ap_paterno),
           ap_materno = COALESCE(?, ap_materno),
           email      = COALESCE(?, email),
           password   = COALESCE(?, password),
           foto       = COALESCE(?, foto)
       WHERE id_empleado = ?`,
      [
        nombre      ?? null,
        ap_paterno  ?? null,
        ap_materno  ?? null,
        email       ?? null,
        password    ?? null,
        foto        ?? null,
        id,
      ]
    );
    cache.delMany(["empleados:all", `empleado:nombre:${id}`]);
  },

  cerrarSesionesHuerfanas: async (id_empleado) => {
    await pool.query(
      `UPDATE historial_acceso SET fecha_salida = NOW()
       WHERE id_empleado = ? AND fecha_salida IS NULL`,
      [id_empleado]
    );
  },

  registrarEntrada: async (id_empleado) => {
    const [result] = await pool.query(
      `INSERT INTO historial_acceso (id_empleado) VALUES (?)`,
      [id_empleado]
    );
    return result.insertId;
  },

  registrarSalida: async (id_acceso) => {
    await pool.query(
      `UPDATE historial_acceso SET fecha_salida = NOW() WHERE id_acceso = ?`,
      [id_acceso]
    );
  },

  getAccesos: async (id_empleado, { limit = 50, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT id_acceso, fecha_entrada, fecha_salida
       FROM historial_acceso
       WHERE id_empleado = ?
       ORDER BY fecha_entrada DESC
       LIMIT ? OFFSET ?`,
      [id_empleado, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM historial_acceso WHERE id_empleado = ?`,
      [id_empleado]
    );
    return { rows, total };
  },

  // Nunca incluir password en listados
  getAll: async () => {
    const hit = cache.get("empleados:all");
    if (hit) return hit;
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.foto, e.estatus, e.id_rol, e.id_departamento, e.id_sucursal,
              d.nombre_departamento, r.nombre_rol, s.nombre_sucursal
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN rol r          ON e.id_rol          = r.id_rol
       LEFT JOIN sucursal s     ON e.id_sucursal     = s.id_sucursal
       ORDER BY e.id_empleado ASC`
    );
    cache.set("empleados:all", rows, TTL_EMPLEADOS);
    return rows;
  },

  getSucursales: async () => {
    const hit = cache.get("cat:sucursales");
    if (hit) return hit;
    const [rows] = await pool.query(`SELECT id_sucursal, nombre_sucursal FROM sucursal ORDER BY nombre_sucursal ASC`);
    cache.set("cat:sucursales", rows, TTL_CATALOGO);
    return rows;
  },

  // Helper reutilizable: nombre completo + departamento de un empleado
  getResumen: async (id_empleado) => {
    const [[row]] = await pool.query(
      `SELECT CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE e.id_empleado = ? LIMIT 1`,
      [id_empleado]
    );
    return row || { nombre_empleado: "Usuario", nombre_departamento: "Sin área" };
  },

  // Helper: nombre completo de un empleado por id
  getNombre: async (id_empleado) => {
    const key = `empleado:nombre:${id_empleado}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const [[row]] = await pool.query(
      `SELECT CONCAT(nombre,' ',ap_paterno,IFNULL(CONCAT(' ',ap_materno),'')) AS nombre_completo FROM empleado WHERE id_empleado = ? LIMIT 1`,
      [id_empleado]
    );
    const nombre = row?.nombre_completo ?? "Soporte técnico";
    cache.set(key, nombre, TTL_NOMBRE);
    return nombre;
  },

  getDepartamentos: async () => {
    const hit = cache.get("cat:departamentos");
    if (hit) return hit;
    const [rows] = await pool.query(`SELECT id_departamento, nombre_departamento FROM departamento ORDER BY nombre_departamento ASC`);
    cache.set("cat:departamentos", rows, TTL_CATALOGO);
    return rows;
  },

  getRoles: async () => {
    const hit = cache.get("cat:roles");
    if (hit) return hit;
    const [rows] = await pool.query(`SELECT id_rol, nombre_rol FROM rol ORDER BY id_rol ASC`);
    cache.set("cat:roles", rows, TTL_CATALOGO);
    return rows;
  },

  updateAdmin: async (id, campos) => {
    const { nombre, ap_paterno, ap_materno, email, id_rol, id_departamento, id_sucursal, estatus, password, foto } = campos;
    // id_sucursal puede ser null (quitar sucursal) o un número, pero si no viene en campos no se toca
    const sucursalEnviada = Object.prototype.hasOwnProperty.call(campos, "id_sucursal");
    if (sucursalEnviada) {
      await pool.query(
        `UPDATE empleado
         SET nombre          = COALESCE(?, nombre),
             ap_paterno      = COALESCE(?, ap_paterno),
             ap_materno      = COALESCE(?, ap_materno),
             email           = COALESCE(?, email),
             id_rol          = COALESCE(?, id_rol),
             id_departamento = COALESCE(?, id_departamento),
             id_sucursal     = ?,
             estatus         = COALESCE(?, estatus),
             password        = COALESCE(?, password),
             foto            = COALESCE(?, foto)
         WHERE id_empleado = ?`,
        [nombre ?? null, ap_paterno ?? null, ap_materno ?? null, email ?? null,
         id_rol ?? null, id_departamento ?? null, id_sucursal ?? null,
         estatus ?? null, password ?? null, foto ?? null, id]
      );
    } else {
      await pool.query(
        `UPDATE empleado
         SET nombre          = COALESCE(?, nombre),
             ap_paterno      = COALESCE(?, ap_paterno),
             ap_materno      = COALESCE(?, ap_materno),
             email           = COALESCE(?, email),
             id_rol          = COALESCE(?, id_rol),
             id_departamento = COALESCE(?, id_departamento),
             estatus         = COALESCE(?, estatus),
             password        = COALESCE(?, password),
             foto            = COALESCE(?, foto)
         WHERE id_empleado = ?`,
        [nombre ?? null, ap_paterno ?? null, ap_materno ?? null, email ?? null,
         id_rol ?? null, id_departamento ?? null,
         estatus ?? null, password ?? null, foto ?? null, id]
      );
    }
    cache.delMany(["empleados:all", `empleado:nombre:${id}`]);
  },

  crear: async ({ num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento, id_sucursal }) => {
    const [result] = await pool.query(
      `INSERT INTO empleado (num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento, id_sucursal, estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
      [num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento, id_sucursal ?? null]
    );
    cache.del("empleados:all");
    return result.insertId;
  },

  getAllAccesos: async ({ limit = 50, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT a.id_acceso, a.id_empleado, a.fecha_entrada, a.fecha_salida,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
              e.email, d.nombre_departamento
       FROM historial_acceso a
       JOIN empleado e ON a.id_empleado = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       ORDER BY a.fecha_entrada DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM historial_acceso`);
    return { rows, total };
  },
};

export default Empleado;
