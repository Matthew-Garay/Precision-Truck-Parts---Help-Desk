import pool from "../Config/db.js";

const Empleado = {
  findByEmail: async (email) => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.password, e.foto, e.estatus, e.id_rol, e.id_departamento,
              d.nombre_departamento
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE e.email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.password, e.foto, e.estatus, e.id_rol, e.id_departamento,
              d.nombre_departamento
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE e.id_empleado = ? LIMIT 1`,
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

  getAccesos: async (id_empleado, { limit = 500, offset = 0 } = {}) => {
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

  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno,
              e.email, e.foto, e.estatus, e.id_rol, e.id_departamento,
              d.nombre_departamento,
              r.nombre_rol
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN rol r ON e.id_rol = r.id_rol
       ORDER BY e.id_empleado ASC`
    );
    return rows;
  },

  getDepartamentos: async () => {
    const [rows] = await pool.query(`SELECT id_departamento, nombre_departamento FROM departamento ORDER BY nombre_departamento ASC`);
    return rows;
  },

  getRoles: async () => {
    const [rows] = await pool.query(`SELECT id_rol, nombre_rol FROM rol ORDER BY id_rol ASC`);
    return rows;
  },

  updateAdmin: async (id, { num_empleado, nombre, ap_paterno, ap_materno, email, id_rol, id_departamento, estatus, password, foto }) => {
    // SQL estático - sin construcción dinámica de nombres de columna
    await pool.query(
      `UPDATE empleado
       SET num_empleado    = COALESCE(?, num_empleado),
           nombre          = COALESCE(?, nombre),
           ap_paterno      = COALESCE(?, ap_paterno),
           ap_materno      = COALESCE(?, ap_materno),
           email           = COALESCE(?, email),
           id_rol          = COALESCE(?, id_rol),
           id_departamento = COALESCE(?, id_departamento),
           estatus         = COALESCE(?, estatus),
           password        = COALESCE(?, password),
           foto            = COALESCE(?, foto)
       WHERE id_empleado = ?`,
      [
        num_empleado    ?? null,
        nombre          ?? null,
        ap_paterno      ?? null,
        ap_materno      ?? null,
        email           ?? null,
        id_rol          ?? null,
        id_departamento ?? null,
        estatus         ?? null,
        password        ?? null,
        foto            ?? null,
        id,
      ]
    );
  },

  crear: async ({ num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento }) => {
    const [result] = await pool.query(
      `INSERT INTO empleado (num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento, estatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
      [num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento]
    );
    return result.insertId;
  },

  getAllAccesos: async ({ limit = 500, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT a.id_acceso, a.id_empleado, a.fecha_entrada, a.fecha_salida,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',e.ap_materno) AS nombre_empleado,
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
