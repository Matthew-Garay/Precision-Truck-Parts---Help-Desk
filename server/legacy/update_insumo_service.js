// scripts/update_insumo_service.js
// Actualiza el servicio insumo.js para añadir el filtro visible_publico
import fs from "fs";
import path from "path";

const filePath = path.resolve(
  "D:",
  "Proyecto de Residencias-Matthew Garay",
  "PrecisionTrucks_HelpDesk",
  "server",
  "services",
  "insumo.js"
);

let content = fs.readFileSync(filePath, "utf8");

// 1. Añadir el check de visible_publico
const checkCode = `
  _tieneVisiblePublico: null,
  _tieneVisiblePublicoCheck: async () => {
    if (Insumo._tieneVisiblePublico !== null) return Insumo._tieneVisiblePublico;
    try {
      const [[{ cnt }]] = await pool.query(
        \`SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'visible_publico'\`
      );
      Insumo._tieneVisiblePublico = Number(cnt) > 0;
    } catch {
      Insumo._tieneVisiblePublico = false;
    }
    return Insumo._tieneVisiblePublico;
  },
`;

content = content.replace(
  "_tieneActivo: null,",
  "_tieneActivo: null,\n" + checkCode
);

// 2. Actualizar getAll
const getAllNew = `getAll: async ({ soloActivos = false } = {}) => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo && soloActivos ? "WHERE i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
              i.marca, i.modelo, i.stock, i.estado,
              i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE 1=1
         \${tieneActivo && soloActivos ? "AND i.activo = 1" : ""}
         \${tieneVisiblePublico ? "AND i.visible_publico = 1" : ""}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

const getAllOld = `getAll: async ({ soloActivos = false } = {}) => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo && soloActivos ? "WHERE i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
              i.marca, i.modelo, i.stock, i.estado,
              i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       \${whereActivo}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

content = content.replace(getAllOld, getAllNew);

// 3. Actualizar getDisponibles
const getDisponiblesNew = `getDisponibles: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo ? "AND i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
         \${whereActivo}
         \${tieneVisiblePublico ? "AND i.visible_publico = 1" : ""}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

const getDisponiblesOld = `getDisponibles: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo ? "AND i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0 \${whereActivo}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

content = content.replace(getDisponiblesOld, getDisponiblesNew);

fs.writeFileSync(filePath, content);
console.log("Archivo actualizado correctamente.");
