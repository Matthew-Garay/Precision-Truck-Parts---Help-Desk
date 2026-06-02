import Empleado from "../Models/Empleado.js";
import bcrypt   from "bcryptjs";
import jwt      from "jsonwebtoken";
import path     from "path";
import fs       from "fs";
import { safeResolvePath } from "../Middlewares/security.js";
import { uploadFoto, FOTOS_DIR, FOTOS_REL } from "../Middlewares/uploadFotos.js";

export { uploadFoto };

export const subirFotoEmpleado = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
    const emp = await Empleado.findById(id);
    if (emp?.foto) {
      // Usar solo el basename para evitar path traversal al borrar foto anterior
      const fotoBase = path.basename(emp.foto);
      try {
        const oldPath = safeResolvePath(FOTOS_DIR, fotoBase);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch { /* ruta inválida, ignorar */ }
    }
    const rutaBD = `${FOTOS_REL}/${req.file.filename}`;
    await Empleado.updateAdmin(id, { foto: rutaBD });
    res.json({ ok: true, foto: rutaBD });
  } catch (err) {
    res.status(500).json({ error: "Error al subir foto", detalle: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  try {
    const empleado = await Empleado.findByEmail(email);
    if (!empleado)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    if (empleado.estatus?.toLowerCase() !== 'activo')
      return res.status(403).json({ error: "Usuario inactivo, contacta al administrador" });
    const coincide = await bcrypt.compare(password, empleado.password);
    if (!coincide)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });

    // Cerrar sesiones huérfanas anteriores y registrar nueva entrada
    await Empleado.cerrarSesionesHuerfanas(empleado.id_empleado);
    const id_acceso = await Empleado.registrarEntrada(empleado.id_empleado);

    const token = jwt.sign(
      { id_empleado: empleado.id_empleado, id_rol: empleado.id_rol },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      ok: true,
      token,
      id_acceso,
      usuario: {
        id_empleado:     empleado.id_empleado,
        num_empleado:    empleado.num_empleado,
        nombre:          empleado.nombre,
        ap_paterno:      empleado.ap_paterno,
        ap_materno:      empleado.ap_materno || "",
        email:           empleado.email,
        foto:            empleado.foto || null,
        id_rol:          empleado.id_rol,
        rol:             empleado.id_rol === 1 ? "admin" : "usuario",
        departamento:    empleado.nombre_departamento,
        id_departamento: empleado.id_departamento,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const logout = async (req, res) => {
  const { id_acceso } = req.body;
  if (!id_acceso) return res.status(400).json({ error: "id_acceso requerido" });
  try {
    await Empleado.registrarSalida(id_acceso);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getAccesos = async (req, res) => {
  const { id } = req.params;
  const limit  = Math.min(parseInt(req.query.limit) || 500, 1000);
  const page   = Math.max(parseInt(req.query.page)  || 1, 1);
  const offset = (page - 1) * limit;
  try {
    const { rows, total } = await Empleado.getAccesos(id, { limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getEmpleadoById = async (req, res) => {
  const { id } = req.params;
  try {
    const emp = await Empleado.findById(parseInt(id));
    if (!emp) return res.status(404).json({ error: "Empleado no encontrado" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getAllEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.getAll();
    res.json(empleados);
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getDepartamentos = async (req, res) => {
  try {
    const deps = await Empleado.getDepartamentos();
    res.json(deps);
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Empleado.getRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const updateEmpleadoAdmin = async (req, res) => {
  const { id } = req.params;
  const { num_empleado, nombre, ap_paterno, ap_materno, email, id_rol, id_departamento, estatus, password_nueva } = req.body;
  try {
    const empleado = await Empleado.findById(id);
    if (!empleado) return res.status(404).json({ error: "Empleado no encontrado" });
    const passwordHash = (password_nueva && password_nueva.trim()) ? await bcrypt.hash(password_nueva.trim(), 10) : undefined;
    await Empleado.updateAdmin(id, {
      num_empleado:    num_empleado    || undefined,
      nombre:          nombre          || undefined,
      ap_paterno:      ap_paterno      || undefined,
      ap_materno:      ap_materno      !== undefined ? ap_materno : undefined,
      email:           email           || undefined,
      id_rol:          id_rol          ? parseInt(id_rol)          : undefined,
      id_departamento: id_departamento ? parseInt(id_departamento) : undefined,
      estatus:         estatus         || undefined,
      password:        passwordHash,
    });
    const actualizado = await Empleado.findById(id);
    res.json({ ok: true, empleado: actualizado });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "El correo o n\u00famero de empleado ya existe" });
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const crearEmpleado = async (req, res) => {
  const { num_empleado, nombre, ap_paterno, ap_materno, email, password, id_rol, id_departamento } = req.body;
  if (!num_empleado || !nombre || !ap_paterno || !email || !password || !id_rol || !id_departamento)
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = await Empleado.crear({ num_empleado, nombre, ap_paterno, ap_materno: ap_materno || "", email, password: hash, id_rol: parseInt(id_rol), id_departamento: parseInt(id_departamento) });
    const nuevo = await Empleado.findById(id);
    res.status(201).json({ ok: true, empleado: nuevo });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "El correo o número de empleado ya existe" });
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const getAllAccesos = async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 500, 1000);
  const page   = Math.max(parseInt(req.query.page)  || 1, 1);
  const offset = (page - 1) * limit;
  try {
    const { rows, total } = await Empleado.getAllAccesos({ limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};

export const actualizarPerfil = async (req, res) => {
  const { id } = req.params;
  // Verificar que el usuario solo pueda editar su propio perfil
  if (parseInt(id) !== req.usuario.id_empleado)
    return res.status(403).json({ error: "No puedes modificar el perfil de otro usuario" });
  const { nombre, ap_paterno, ap_materno, email, password_actual, password_nueva } = req.body;
  try {
    const empleado = await Empleado.findById(id);
    if (!empleado) return res.status(404).json({ error: "Usuario no encontrado" });
    if (password_nueva) {
      if (!password_actual)
        return res.status(400).json({ error: "La contraseña actual es requerida" });
      const coincide = await bcrypt.compare(password_actual, empleado.password);
      if (!coincide)
        return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }
    const nuevoHash = password_nueva ? await bcrypt.hash(password_nueva, 10) : undefined;
    await Empleado.updatePerfil(id, { nombre, ap_paterno, ap_materno, email, password: nuevoHash });
    const actualizado = await Empleado.findById(id);
    res.json({
      ok: true,
      usuario: {
        id_empleado:     actualizado.id_empleado,
        num_empleado:    actualizado.num_empleado,
        nombre:          actualizado.nombre,
        ap_paterno:      actualizado.ap_paterno,
        ap_materno:      actualizado.ap_materno || "",
        email:           actualizado.email,
        foto:            actualizado.foto || null,
        id_rol:          actualizado.id_rol,
        rol:             actualizado.id_rol === 1 ? "admin" : "usuario",
        departamento:    actualizado.nombre_departamento,
        id_departamento: actualizado.id_departamento,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", detalle: err.message });
  }
};
